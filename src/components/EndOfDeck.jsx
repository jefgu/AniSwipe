export default function EndOfDeck({ total }) {
  return (
    <section className="end-panel">
      <p className="eyebrow">Deck complete</p>
      <h2>{total} anime rated</h2>
      <p>You’ve voted on everything — see how others voted</p>
    </section>
  );
}
