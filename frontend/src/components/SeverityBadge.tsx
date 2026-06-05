const colors: Record<string, string> = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' };

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => (
  <span style={{
    backgroundColor: colors[severity] ?? '#6b7280',
    color: '#fff', fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 12, whiteSpace: 'nowrap',
  }}>{severity}</span>
);

export default SeverityBadge;
