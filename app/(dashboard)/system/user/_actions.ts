export async function listUsers() {
  const res = await fetch('/api/system/users');
  return res.json();
}
