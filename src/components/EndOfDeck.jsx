export default function EndOfDeck({ total }) {
  return (
    <section className="end-panel">
      <p className="eyebrow">Deck complete</p>
      <h2>{total} anime rated</h2>
      <p>Results and matches are ready.</p>
    </section>
  );
}
