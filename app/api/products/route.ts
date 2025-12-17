import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

//export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const price = Number(formData.get("price"));
    const category_id = formData.get("category_id") as string;
    const published = formData.get("published") === "true";
    const file = formData.get("image") as File | null;

    if (!name || isNaN(price) || !category_id) {
      return NextResponse.json(
        { error: "الرجاء إدخال جميع الحقول المطلوبة" },
        { status: 400 }
      );
    }

    let imageUrl = "";

    // ✅ رفع الصورة (إن وُجدت)
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `products/${Date.now()}.${fileExt}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from("product-images")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        return NextResponse.json(
          { error: "فشل رفع الصورة" },
          { status: 500 }
        );
      }

      const { data } = supabaseAdmin.storage
        .from("product-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    // ✅ إدخال المنتج (يتجاوز RLS)
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        description,
        price,
        image: imageUrl,
        category_id,
        published,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "فشل إضافة المنتج" },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "خطأ في السيرفر" },
      { status: 500 }
    );
  }
}
