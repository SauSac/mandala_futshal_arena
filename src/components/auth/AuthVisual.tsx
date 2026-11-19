import Football from "../home/Football";

export default function AuthVisual() {
  return (
    <div className="auth-scene" aria-hidden="true">
      <div className="auth-scene-grid" />
      <div className="auth-stadium-glow auth-glow-one" />
      <div className="auth-stadium-glow auth-glow-two" />
      <div className="auth-light-beam auth-beam-one" />
      <div className="auth-light-beam auth-beam-two" />

      <div className="auth-pitch">
        <div className="auth-pitch-line auth-pitch-midline" />
        <div className="auth-pitch-circle" />
        <div className="auth-pitch-box auth-pitch-box-left" />
        <div className="auth-pitch-box auth-pitch-box-right" />
      </div>

      <div className="auth-ball-orbit auth-ball-orbit-one" />
      <div className="auth-ball-orbit auth-ball-orbit-two" />
      <Football size={300} speed={1.15} className="auth-football" />

      <div className="auth-float-card auth-float-card-top">
        <span className="auth-float-icon">✦</span>
        <span><strong>YOUR NEXT MATCH</strong><small>IS CLOSER THAN YOU THINK</small></span>
      </div>
      <div className="auth-float-card auth-float-card-bottom">
        <span className="auth-online-indicator" />
        <span><strong>GAME ON</strong><small>Find · Book · Play</small></span>
      </div>
      <div className="auth-scene-grain" />
    </div>
  );
}
