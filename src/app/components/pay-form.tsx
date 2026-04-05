import { useState } from "react";

interface PayFormProps {
  onPay: () => void;
  amount: number;
}

const btn = {
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  transition: "all 0.2s"
};

const chip = {
  border: "none",
  borderRadius: 6,
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  transition: "all 0.2s"
};

const inp = {
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  width: "100%",
  outline: "none"
};

export function PayForm({ onPay, amount }: PayFormProps) {
  const [method, setMethod] = useState<"card" | "transfer">("card");
  const [cn, setCn] = useState("");
  const [cname, setCname] = useState("");
  const [cexp, setCexp] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const tlFormat = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0
    }).format(Math.round(n));

  const handlePay = () => {
    if (method === "card") {
      const cardNumber = cn.replace(/\s/g, "");
      if (cardNumber.length < 16 || !cname || cexp.length < 5 || cvv.length < 3) {
        alert("Lütfen tüm kart bilgilerini eksiksiz doldurun.");
        return;
      }
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPay();
    }, 1200);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          ["card", "💳 Kredi Kartı"],
          ["transfer", "🏦 Havale"]
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setMethod(v as "card" | "transfer")}
            style={{
              ...chip,
              background: method === v ? "#1e3a8a" : "#f3f0eb",
              color: method === v ? "white" : "#0B1D3A"
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {method === "card" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            value={cn}
            onChange={(e) => {
              const formatted = e.target.value
                .replace(/\D/g, "")
                .replace(/(.{4})/g, "$1 ")
                .trim()
                .slice(0, 19);
              setCn(formatted);
            }}
            placeholder="Kart Numarası"
            style={inp}
          />
          <input
            value={cname}
            onChange={(e) => setCname(e.target.value)}
            placeholder="Kart Üzerindeki İsim"
            style={inp}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <input
              value={cexp}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                setCexp(v);
              }}
              placeholder="AA/YY"
              style={inp}
              maxLength={5}
            />
            <input
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="CVV"
              type="password"
              style={inp}
              maxLength={4}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#F0F9FF",
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: "#0369A1"
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Havale Bilgileri</div>
          <div>IBAN: TR12 0001 0000 1234 5678 9012 34</div>
          <div>Alıcı: Müteahhitlik Belgesi Danışmanlık Ltd. Şti.</div>
          <div>Açıklama: Lütfen firma adınızı yazın</div>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={processing}
        style={{
          ...btn,
          width: "100%",
          background: processing ? "#9CA3AF" : "#16A34A",
          color: "white",
          padding: 12,
          marginTop: 10,
          fontSize: 14,
          opacity: processing ? 0.7 : 1,
          cursor: processing ? "not-allowed" : "pointer"
        }}
      >
        {processing ? "İşleniyor..." : method === "card" ? `${tlFormat(amount)} Öde` : "Havale Yaptım"}
      </button>
    </div>
  );
}
