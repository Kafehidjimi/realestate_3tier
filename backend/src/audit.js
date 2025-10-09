export async function log(prisma, { userId, action, entity, entityId, before, after }) {
  try {
    await prisma.auditLog.create({ data: { userId: userId || null, action, entity, entityId: entityId || null, before: before || null, after: after || null } })
  } catch (e) {
    console.error('Audit log failed', e.message)
  }
}
