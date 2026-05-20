export const ok   = (data, status = 200)  => Response.json({ success: true,  data },            { status })
export const created = (data)             => Response.json({ success: true,  data },            { status: 201 })
export const msg  = (message, status=200) => Response.json({ success: true,  message },         { status })
export const err  = (message, status=400) => Response.json({ success: false, message },         { status })
export const notFound = (m='Not found.') => Response.json({ success: false, message: m },      { status: 404 })
export const serverErr = (e) => {
  console.error(e)
  return Response.json({ success: false, message: e?.message || 'Server error.' }, { status: 500 })
}
