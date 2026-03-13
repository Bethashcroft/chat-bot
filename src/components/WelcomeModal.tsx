interface WelcomeModalProps {
  onClose: () => void;
}

function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Welcome to Chat Bot</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-intro">
            I'm an AI assistant powered by Google Gemini (Flash 2.5 Lite).
            Here's what you should know:
          </p>
          <div className="modal-section can-do">
            <h3>What I can help with</h3>
            <ul>
              <li>Answering general knowledge questions</li>
              <li>Explaining concepts and ideas</li>
              <li>Writing, brainstorming and creativity</li>
              <li>Help with code and technical topics</li>
            </ul>
          </div>
          <div className="modal-section cannot-do">
            <h3>My limitations</h3>
            <ul>
              <li>I can't browse the internet or provide links</li>
              <li>
                I don't have access to real-time data (weather, news, stocks)
              </li>
              <li>I may occasionally generate incorrect information</li>
              <li>I can't generate images.</li>
            </ul>
          </div>
          <p className="modal-disclaimer">
            My responses are based on patterns learned during training — not
            from searching the web. Always fact check information.
          </p>
        </div>
        <button className="modal-button" onClick={onClose}>
          Got it, let's chat!
        </button>
      </div>
    </div>
  );
}

export default WelcomeModal;
