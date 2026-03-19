export async function uploadFile(supabase, file, folder) {
  const ext = file.name.split('.').pop();
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('uploads').upload(name, file);
  if (error) throw error;

  const { data } = supabase.storage.from('uploads').getPublicUrl(name);
  return data.publicUrl;
}
