import { useApp } from "../context/AppContext.jsx";

export default function Resources() {
  const { mode } = useApp();
  const teen = mode === "teen";

  return (
    <section className='grid responsive'>
      <div className='card'>
        <h2>Quick guidance</h2>
        <ul>
          <li>
            <b>DON’T PAY</b> and <b>DON'T SEND</b> more content.
          </li>
          <li>
            <b>PRESERVE</b> evidence (screenshots, usernames, receipts) in the
            Vault.
          </li>
          <li>
            <b>REPORT</b> using platform tools and your local authorities.
          </li>
        </ul>
      </div>

      <div className='card'>
        <h3>{teen ? "Tell a trusted adult" : "How to support a teen"}</h3>
        {teen ? (
          <p className='badge'>Script:</p>
        ) : (
          <p className='badge'>Support tips:</p>
        )}
        {teen ? (
          <blockquote>
            “I’m getting threatened online. I didn’t know what to do. I haven’t
            sent anything else or paid. Can you help me report it and keep me
            safe?”
          </blockquote>
        ) : (
          <ul>
            <li>Stay calm, avoid blame, focus on safety.</li>
            <li>Help preserve evidence and complete a report.</li>
            <li>Contact school if needed; consider law enforcement.</li>
          </ul>
        )}
      </div>
    </section>
  );
}
