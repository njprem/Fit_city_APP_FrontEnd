import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../api"; // ปรับ path ให้ตรงโปรเจกต์ของคุณ

export default function DestinationSlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;

    (async () => {
      try {
        // ทางเลือกที่ 1: ถ้ามี endpoint หา id จาก slug โดยตรง
        const data = await api.get(`/api/v1/destinations/slug/${encodeURIComponent(slug)}`);
        let id = data?.id ?? data?.destination?.id;

        if (id) {
          navigate(`/destination/${id}`, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        navigate("/", { replace: true });
      }
    })();
  }, [slug, navigate]);

  return null;
}
