export function requireRole(...roles) {
  return (req, res, next) => {
    const r = req.user?.role || (req.user?.isStaff ? 'admin' : 'viewer')
    if (!r || (roles.length && !roles.includes(r))) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}
