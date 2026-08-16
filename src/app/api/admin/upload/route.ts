import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// Gunakan Service Role Key agar bisa bypass RLS (karena ini di sisi server)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    console.log("Upload API: Request received");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Upload API Error: Supabase credentials missing in .env");
      return NextResponse.json({ error: "Server configuration missing (Supabase URL or Key)" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'images';
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${nanoid()}.${fileExt}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error("Supabase Storage Error:", error);
      throw error;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Upload API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
