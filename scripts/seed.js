require('dotenv').config()
const bcrypt = require('bcryptjs')
const mysql  = require('mysql2/promise')

async function seed() {
  if (process.env.NODE_ENV === 'production') { console.error('❌  Cannot seed in production.'); process.exit(1) }
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  console.log('🌱  Seeding SmartShelf Next...\n')
  try {
    await conn.beginTransaction()
    await conn.execute('DELETE FROM return_items'); await conn.execute('DELETE FROM returns')
    await conn.execute('DELETE FROM purchase_items'); await conn.execute('DELETE FROM purchases')
    await conn.execute('DELETE FROM sale_items'); await conn.execute('DELETE FROM sales')
    await conn.execute('DELETE FROM people'); await conn.execute('DELETE FROM users')
    await conn.execute('ALTER TABLE users  AUTO_INCREMENT = 1')
    await conn.execute('ALTER TABLE people AUTO_INCREMENT = 1')
    console.log('  🗑   Cleared transactional data (products & images preserved)\n')

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10
    const users  = [
      { name: 'Admin User',  email: 'admin@demo.com', phone: '0400000001', role: 'admin', password: 'admin123' },
      { name: 'Staff Alice', email: 'alice@demo.com', phone: '0400000002', role: 'staff', password: 'staff123' },
      { name: 'Staff Bob',   email: 'bob@demo.com',   phone: '0400000003', role: 'staff', password: 'staff123' },
    ]
    const userIds = {}
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, rounds)
      const [r] = await conn.execute('INSERT INTO users (name,email,phone,password_hash,role) VALUES (?,?,?,?,?)', [u.name, u.email, u.phone, hash, u.role])
      userIds[u.email] = r.insertId
      console.log(`  ✔  [${u.role}] ${u.email} / ${u.password}`)
    }

    const [existingCats] = await conn.execute('SELECT id,name FROM categories')
    let catIds = {}
    if (existingCats.length) { existingCats.forEach(c => { catIds[c.name] = c.id }); console.log(`\n  ✔  ${existingCats.length} categories kept`) }
    else {
      for (const name of ['Fresh Produce','Dairy & Eggs','Meat & Seafood','Dry Goods','Bakery','Beverages','Snacks & Confectionery']) {
        const [r] = await conn.execute('INSERT INTO categories (name) VALUES (?)', [name]); catIds[name] = r.insertId
      }
      console.log(`\n  ✔  7 categories created`)
    }

    const [existingProds] = await conn.execute('SELECT id,sku FROM products')
    let productIds = {}
    if (existingProds.length) { existingProds.forEach(p => { productIds[p.sku] = p.id }); console.log(`  ✔  ${existingProds.length} products kept (images preserved)`) }
    else {
      const prods = [
        { cat:'Fresh Produce',          name:'Granny Smith Apples',  sku:'FP-001', price:3.99,  cost:2.00,  unit:'kg',    stock:50, thr:10 },
        { cat:'Fresh Produce',          name:'Baby Spinach 200g',    sku:'FP-002', price:3.50,  cost:1.80,  unit:'bag',   stock:30, thr:8  },
        { cat:'Fresh Produce',          name:'Avocado Hass',         sku:'FP-003', price:2.50,  cost:1.20,  unit:'each',  stock:45, thr:10 },
        { cat:'Fresh Produce',          name:'Bananas',              sku:'FP-004', price:2.99,  cost:1.50,  unit:'kg',    stock:60, thr:15 },
        { cat:'Dairy & Eggs',           name:'Full Cream Milk 2L',   sku:'DA-001', price:3.20,  cost:1.90,  unit:'each',  stock:40, thr:10 },
        { cat:'Dairy & Eggs',           name:'Free Range Eggs 12pk', sku:'DA-002', price:7.50,  cost:4.50,  unit:'dozen', stock:20, thr:5  },
        { cat:'Meat & Seafood',         name:'Chicken Breast 500g',  sku:'MS-001', price:8.99,  cost:5.00,  unit:'pack',  stock:25, thr:8  },
        { cat:'Meat & Seafood',         name:'Beef Mince 500g',      sku:'MS-002', price:9.50,  cost:5.50,  unit:'pack',  stock:30, thr:10 },
        { cat:'Dry Goods',              name:'Jasmine Rice 5kg',     sku:'DG-001', price:12.99, cost:7.00,  unit:'bag',   stock:25, thr:5  },
        { cat:'Dry Goods',              name:'Pasta Penne 500g',     sku:'DG-002', price:2.50,  cost:1.20,  unit:'each',  stock:60, thr:10 },
        { cat:'Bakery',                 name:'Sourdough Loaf',       sku:'BK-001', price:7.00,  cost:3.50,  unit:'each',  stock:10, thr:3  },
        { cat:'Bakery',                 name:'Wholemeal Bread',      sku:'BK-002', price:5.00,  cost:2.50,  unit:'each',  stock:15, thr:4  },
        { cat:'Beverages',              name:'Orange Juice 1L',      sku:'BV-001', price:5.50,  cost:2.80,  unit:'each',  stock:35, thr:8  },
        { cat:'Beverages',             name:'Sparkling Water 1L',   sku:'BV-002', price:2.99,  cost:1.20,  unit:'each',  stock:40, thr:10 },
        { cat:'Snacks & Confectionery', name:'Potato Chips 150g',    sku:'SC-001', price:4.50,  cost:2.00,  unit:'bag',   stock:50, thr:15 },
      ]
      for (const p of prods) {
        const [r] = await conn.execute('INSERT INTO products (category_id,name,sku,price,cost_price,unit,stock_quantity,low_stock_threshold) VALUES (?,?,?,?,?,?,?,?)', [catIds[p.cat], p.name, p.sku, p.price, p.cost, p.unit, p.stock, p.thr])
        productIds[p.sku] = r.insertId
      }
      console.log(`  ✔  15 products created`)
    }
    console.log('')

    const pid = sku => productIds[sku]
    const aid = userIds['admin@demo.com'], aliceId = userIds['alice@demo.com'], bobId = userIds['bob@demo.com']
    const ago = d => { const dt = new Date(); dt.setDate(dt.getDate()-d); return dt.toISOString().slice(0,19).replace('T',' ') }

    const people = [
      { type:'customer', name:'John Smith',        email:'john.smith@example.com',   phone:'0411 111 111', address:'12 King St, Sydney NSW 2000' },
      { type:'customer', name:'Sarah Johnson',     email:'sarah.j@example.com',      phone:'0422 222 222', address:'34 Queen Rd, Melbourne VIC 3000' },
      { type:'customer', name:'Michael Chen',      email:'mchen@example.com',        phone:'0433 333 333', address:'56 George Ave, Brisbane QLD 4000' },
      { type:'customer', name:'Emily Wilson',      email:'emily.w@example.com',      phone:'0444 444 444', address:'78 Market Ln, Perth WA 6000' },
      { type:'customer', name:'David Brown',       email:'david.b@example.com',      phone:'0455 555 555', address:'90 Collins St, Adelaide SA 5000' },
      { type:'customer', name:'Lisa Nguyen',       email:'lisa.n@example.com',       phone:'0466 666 666', address:'23 Flinders St, Melbourne VIC 3001' },
      { type:'customer', name:'James Taylor',      email:'james.t@example.com',      phone:'0477 777 777', address:'45 Pitt St, Sydney NSW 2001' },
      { type:'customer', name:'Anna Martinez',     email:'anna.m@example.com',       phone:'0488 888 888', address:'67 Elizabeth St, Hobart TAS 7000' },
      { type:'customer', name:'Chris Anderson',    email:'chris.a@example.com',      phone:'0499 999 999', address:'89 Mitchell St, Darwin NT 0800' },
      { type:'customer', name:'Jessica Lee',       email:'jessica.l@example.com',    phone:'0400 100 200', address:'11 London Circuit, Canberra ACT 2600' },
      { type:'supplier', name:'Fresh Farms Co',       email:'orders@freshfarms.com',  phone:'02 9000 1111', address:'100 Farm Rd, Penrith NSW 2750' },
      { type:'supplier', name:'Metro Wholesale Foods', email:'supply@metrowholesale.com', phone:'03 9000 2222', address:'200 Warehouse Dr, Dandenong VIC 3175' },
      { type:'supplier', name:'Pacific Seafood Co',    email:'fish@pacificseafood.com',  phone:'07 9000 3333', address:'300 Harbour Rd, Cairns QLD 4870' },
      { type:'supplier', name:'Aussie Dairy Direct',   email:'dairy@aussiedirect.com',   phone:'08 9000 4444', address:'400 Pastoral Way, Shepparton VIC 3630' },
      { type:'supplier', name:'Golden Grain Traders',  email:'grains@goldengrain.com',   phone:'02 9000 5555', address:'500 Mill St, Wagga Wagga NSW 2650' },
    ]
    const personIds = {}
    for (const p of people) {
      const [r] = await conn.execute('INSERT INTO people (type,name,email,phone,address) VALUES (?,?,?,?,?)', [p.type, p.name, p.email, p.phone, p.address])
      personIds[p.name] = r.insertId
    }
    console.log('  ✔  10 customers + 5 suppliers')

    const salesData = [
      { sid:aliceId, cust:'John Smith',    note:'Weekly grocery', at:ago(1), items:[{sku:'FP-001',q:2,p:3.99},{sku:'DA-001',q:1,p:3.20},{sku:'BK-001',q:1,p:7.00}] },
      { sid:aliceId, cust:'Sarah Johnson', note:null,             at:ago(2), items:[{sku:'DA-002',q:2,p:7.50},{sku:'FP-002',q:1,p:3.50}] },
      { sid:aliceId, cust:'Michael Chen',  note:'Bulk order',     at:ago(3), items:[{sku:'DG-001',q:3,p:12.99},{sku:'DG-002',q:4,p:2.50},{sku:'BV-001',q:2,p:5.50}] },
      { sid:aliceId, cust:null,            note:'Walk-in',        at:ago(4), items:[{sku:'SC-001',q:3,p:4.50},{sku:'BV-002',q:2,p:2.99}] },
      { sid:aliceId, cust:'Emily Wilson',  note:null,             at:ago(5), items:[{sku:'MS-001',q:2,p:8.99},{sku:'MS-002',q:1,p:9.50},{sku:'FP-003',q:3,p:2.50}] },
      { sid:aliceId, cust:'David Brown',   note:null,             at:ago(7), items:[{sku:'FP-004',q:2,p:2.99},{sku:'DA-001',q:2,p:3.20},{sku:'BK-002',q:1,p:5.00}] },
      { sid:bobId,   cust:'Lisa Nguyen',   note:'Regular',        at:ago(1), items:[{sku:'FP-001',q:1,p:3.99},{sku:'FP-002',q:2,p:3.50},{sku:'DA-002',q:1,p:7.50}] },
      { sid:bobId,   cust:'James Taylor',  note:null,             at:ago(2), items:[{sku:'MS-001',q:3,p:8.99},{sku:'DG-002',q:2,p:2.50}] },
      { sid:bobId,   cust:'Anna Martinez', note:'Birthday',       at:ago(3), items:[{sku:'BV-001',q:4,p:5.50},{sku:'SC-001',q:5,p:4.50},{sku:'BK-001',q:2,p:7.00}] },
      { sid:bobId,   cust:'Chris Anderson',note:null,             at:ago(6), items:[{sku:'DG-001',q:2,p:12.99},{sku:'FP-004',q:3,p:2.99}] },
      { sid:bobId,   cust:null,            note:null,             at:ago(8), items:[{sku:'BV-002',q:6,p:2.99},{sku:'SC-001',q:2,p:4.50}] },
      { sid:aid,     cust:'Jessica Lee',   note:'VIP order',      at:ago(1), items:[{sku:'MS-001',q:2,p:8.99},{sku:'MS-002',q:2,p:9.50},{sku:'DA-002',q:2,p:7.50},{sku:'FP-001',q:3,p:3.99}] },
    ]
    for (const s of salesData) {
      const total = s.items.reduce((a,i)=>a+i.p*i.q, 0)
      const custId = s.cust ? personIds[s.cust] : null
      const [sr] = await conn.execute('INSERT INTO sales (staff_id,customer_id,total_amount,note,created_at) VALUES (?,?,?,?,?)', [s.sid, custId, total.toFixed(2), s.note, s.at])
      for (const item of s.items) {
        await conn.execute('INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?)', [sr.insertId, pid(item.sku), item.q, item.p, (item.p*item.q).toFixed(2)])
        await conn.execute('UPDATE products SET stock_quantity=stock_quantity-? WHERE id=?', [item.q, pid(item.sku)])
      }
    }
    console.log(`  ✔  ${salesData.length} sales`)

    const purchasesData = [
      { sid:aliceId, supp:'Fresh Farms Co',        note:'Produce restock',   at:ago(2),  items:[{sku:'FP-001',q:100,c:2.00},{sku:'FP-002',q:60,c:1.80},{sku:'FP-003',q:80,c:1.20},{sku:'FP-004',q:120,c:1.50}] },
      { sid:aliceId, supp:'Aussie Dairy Direct',   note:'Dairy delivery',    at:ago(3),  items:[{sku:'DA-001',q:80,c:1.90},{sku:'DA-002',q:40,c:4.50}] },
      { sid:bobId,   supp:'Pacific Seafood Co',    note:'Meat & seafood',    at:ago(4),  items:[{sku:'MS-001',q:50,c:5.00},{sku:'MS-002',q:60,c:5.50}] },
      { sid:bobId,   supp:'Golden Grain Traders',  note:'Dry goods bulk',    at:ago(5),  items:[{sku:'DG-001',q:40,c:7.00},{sku:'DG-002',q:100,c:1.20}] },
      { sid:aliceId, supp:'Metro Wholesale Foods', note:'Bakery supplies',   at:ago(6),  items:[{sku:'BK-001',q:30,c:3.50},{sku:'BK-002',q:40,c:2.50}] },
      { sid:bobId,   supp:'Fresh Farms Co',        note:'Beverage restock',  at:ago(7),  items:[{sku:'BV-001',q:60,c:2.80},{sku:'BV-002',q:80,c:1.20}] },
      { sid:aliceId, supp:'Metro Wholesale Foods', note:'Snacks top-up',     at:ago(9),  items:[{sku:'SC-001',q:100,c:2.00}] },
      { sid:aid,     supp:'Fresh Farms Co',        note:'Emergency restock', at:ago(1),  items:[{sku:'FP-001',q:50,c:2.00},{sku:'FP-004',q:50,c:1.50}] },
      { sid:bobId,   supp:'Aussie Dairy Direct',   note:'Extra dairy',       at:ago(10), items:[{sku:'DA-001',q:40,c:1.90},{sku:'DA-002',q:20,c:4.50}] },
      { sid:aliceId, supp:'Golden Grain Traders',  note:'Monthly grains',    at:ago(14), items:[{sku:'DG-001',q:50,c:7.00},{sku:'DG-002',q:80,c:1.20}] },
    ]
    for (const pu of purchasesData) {
      const total = pu.items.reduce((a,i)=>a+i.c*i.q, 0)
      const [pr] = await conn.execute('INSERT INTO purchases (staff_id,supplier_id,total_amount,note,created_at) VALUES (?,?,?,?,?)', [pu.sid, personIds[pu.supp], total.toFixed(2), pu.note, pu.at])
      for (const item of pu.items) {
        await conn.execute('INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?)', [pr.insertId, pid(item.sku), item.q, item.c, (item.c*item.q).toFixed(2)])
        await conn.execute('UPDATE products SET stock_quantity=stock_quantity+? WHERE id=?', [item.q, pid(item.sku)])
      }
    }
    console.log(`  ✔  ${purchasesData.length} purchases`)

    const returnsData = [
      { sid:aliceId, status:'approved', reason:'Customer changed mind',              at:ago(3), items:[{sku:'SC-001',q:2,p:4.50},{sku:'BV-002',q:1,p:2.99}] },
      { sid:bobId,   status:'approved', reason:'Damaged packaging',                  at:ago(5), items:[{sku:'DA-001',q:1,p:3.20}] },
      { sid:aliceId, status:'approved', reason:'Wrong product picked',               at:ago(7), items:[{sku:'BK-001',q:1,p:7.00}] },
      { sid:bobId,   status:'approved', reason:'Product near expiry',                at:ago(9), items:[{sku:'FP-002',q:3,p:3.50}] },
      { sid:aliceId, status:'rejected', reason:'Stock count verified correct',       at:ago(4), items:[{sku:'DG-001',q:1,p:12.99}] },
      { sid:bobId,   status:'rejected', reason:'Product opened — cannot return',     at:ago(6), items:[{sku:'MS-001',q:1,p:8.99}] },
      { sid:aliceId, status:'pending',  reason:'Customer unhappy with freshness',    at:ago(1), items:[{sku:'FP-001',q:2,p:3.99},{sku:'FP-003',q:1,p:2.50}] },
      { sid:bobId,   status:'pending',  reason:'Incorrect price charged',            at:ago(2), items:[{sku:'DA-002',q:1,p:7.50},{sku:'BV-001',q:1,p:5.50}] },
    ]
    for (const ret of returnsData) {
      const total = ret.items.reduce((a,i)=>a+i.p*i.q, 0)
      const [rr] = await conn.execute('INSERT INTO returns (staff_id,total_amount,reason,status,created_at) VALUES (?,?,?,?,?)', [ret.sid, total.toFixed(2), ret.reason, ret.status, ret.at])
      for (const item of ret.items) {
        await conn.execute('INSERT INTO return_items (return_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?)', [rr.insertId, pid(item.sku), item.q, item.p, (item.p*item.q).toFixed(2)])
        if (ret.status === 'approved') await conn.execute('UPDATE products SET stock_quantity=stock_quantity+? WHERE id=?', [item.q, pid(item.sku)])
      }
    }
    console.log(`  ✔  ${returnsData.length} returns (4 approved · 2 rejected · 2 pending)\n`)

    await conn.commit()
    console.log('✅  Seed complete!\n')
    console.log('─── Login Accounts ───────────────────────────────────')
    console.log('  [ADMIN]  admin@demo.com  /  admin123')
    console.log('  [STAFF]  alice@demo.com  /  staff123')
    console.log('  [STAFF]  bob@demo.com    /  staff123')
    console.log('──────────────────────────────────────────────────────\n')
  } catch (err) {
    await conn.rollback()
    console.error('❌  Seed failed:', err.message)
    throw err
  } finally {
    await conn.end()
  }
}

seed().catch(() => process.exit(1))
