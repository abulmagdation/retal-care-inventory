import { AuditLog } from './models.js';

export async function recordAudit({ user, action, entityType, entityId, label, details = {} }) {
  return AuditLog.create({
    actor: user?._id || undefined,
    actorName: user?.name || 'النظام',
    actorEmail: user?.email || undefined,
    action,
    entityType,
    entityId,
    label,
    details,
  });
}
