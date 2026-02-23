export function generateCommitId(): string {
  return crypto.randomUUID().slice(0, 7);
}
