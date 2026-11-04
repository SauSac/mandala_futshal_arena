/** Lightweight CSS-3D football: shaded sphere + rotating meridian seams. No dependencies. */
export default function Football() {
  return (
    <div className="ball-stage" aria-hidden>
      <div className="float h-full w-full">
        <div className="ball-tilt">
          <div className="ball-core" />
          <div className="ball">
            {[0, 30, 60, 90, 120, 150].map((r) => (<i key={r} style={{ "--r": `${r}deg` } as React.CSSProperties} />))}
            <i className="eq" />
            {[[0, 0], [72, 38], [144, 38], [216, 38], [288, 38], [36, -38], [108, -38], [180, -38], [252, -38], [324, -38], [0, 90], [0, -90]].map(([y, x]) => (
              <b key={`${y}${x}`} style={{ "--y": `${y}deg`, "--x": `${x}deg` } as React.CSSProperties} />
            ))}
          </div>
          <div className="ball-shine" />
        </div>
      </div>
      <div className="ball-ground" />
    </div>
  );
}