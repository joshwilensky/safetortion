import { Routes, Route, Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import PanicButton from "./components/PanicButton.jsx";
import ChatScanner from "./components/ChatScanner.jsx";
import EvidenceVault from "./components/EvidenceVault.jsx";
import ReportingWizard from "./components/ReportingWizard.jsx";
import Resources from "./components/Resources.jsx";
import ModeToggle from "./components/ModeToggle.jsx";
import EncryptionBar from "./components/EncryptionBar.jsx";
import DangerZoneButton from "./components/DangerZoneButton.jsx";
import FileCapture from "./components/FileCapture.jsx";
import { useApp } from "./context/AppContext.jsx";
import EvidenceLink from "./components/EvidenceLink.jsx";
import EncryptionMenuButton from "./components/EncryptionMenuButton.jsx";
import GlobalSafety from "./components/GlobalSafety.jsx";
import Header from "./components/Header.jsx";
export default function App() {
  // Save OCR notes coming from EvidenceVault actions
  const { addEvidence } = useApp();
  useEffect(() => {
    const handler = (e) => {
      const { item, text } = e.detail || {};
      if (!text) return;
      addEvidence({
        type: "note",
        title: `OCR from: ${item?.title || item?.id}`,
        content: text,
        metadata: { sourceId: item?.id, kind: "ocr" },
      });
    };
    window.addEventListener("save-ocr-note", handler);
    return () => window.removeEventListener("save-ocr-note", handler);
  }, [addEvidence]);

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className='app'>
      {/* Header */}
      <header className={`site-header ${menuOpen ? "open" : ""}`}>
        <div className='head-inner'>
          <div className='brand-wrap'>
            <Link to='/' className='brand'>
              BocaSafe
            </Link>
            <button
              className='hamburger'
              aria-label='Toggle navigation'
              aria-expanded={menuOpen ? "true" : "false"}
              onClick={() => setMenuOpen((v) => !v)}>
              <span />
              <span />
              <span />
            </button>

            <nav className='main-nav' onClick={() => setMenuOpen(false)}>
              <NavLink to='/scan' className='navlink'>
                Scan a Chat
              </NavLink>
              <NavLink to='/upload' className='navlink'>
                Add Files
              </NavLink>
              <NavLink to='/vault' className='navlink'>
                Evidence Vault
              </NavLink>
              <NavLink to='/report' className='navlink'>
                Report
              </NavLink>
              <NavLink to='/resources' className='navlink'>
                Resources
              </NavLink>
              <NavLink to='/link' className='navlink'>
                Evidence Link
              </NavLink>
            </nav>

            <div className='head-actions'>
              {/* <GlobalSafety /> */}
              <EncryptionMenuButton />
              <ModeToggle />
              <PanicButton />
              <DangerZoneButton />
            </div>
          </div>
        </div>
        {/* Mobile drawer */}
        <div className='mobile-drawer' onClick={() => setMenuOpen(false)}>
          <div className='drawer-panel' onClick={(e) => e.stopPropagation()}>
            <div className='drawer-group'>
              <NavLink to='/scan' className='navlink'>
                Scan a Chat
              </NavLink>
              <NavLink to='/upload' className='navlink'>
                Add Files
              </NavLink>
              <NavLink to='/vault' className='navlink'>
                Evidence Vault
              </NavLink>
              <NavLink to='/report' className='navlink'>
                Report
              </NavLink>
              <NavLink to='/resources' className='navlink'>
                Resources
              </NavLink>
              <NavLink to='/link' className='navlink'>
                Evidence Link
              </NavLink>
            </div>
            <div className='drawer-group actions'>
              {/* <EncryptionBar /> */}
              <ModeToggle />
              <PanicButton />
              <DangerZoneButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className='main'>
        <Routes>
          <Route
            index
            element={
              <div className='hero'>
                <h1 style={{ fontSize: "50px" }}>
                  Defend Yourself Against Sextortion!
                </h1>
                <h2>
                  Get real-time warnings, preserve evidence and report safely.
                </h2>
                <div
                  className='cta-row'
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}>
                  <NavLink to='/scan' className='btn primary'>
                    Scan a Chat
                  </NavLink>
                  <NavLink to='/upload' className='btn'>
                    Add Files
                  </NavLink>
                  <NavLink to='/vault' className='btn'>
                    Evidence Vault
                  </NavLink>
                </div>
              </div>
            }
          />
          <Route path='/scan' element={<ChatScanner />} />
          <Route path='/upload' element={<FileCapture />} />
          <Route path='/vault' element={<EvidenceVault />} />
          <Route path='/report' element={<ReportingWizard />} />
          <Route path='/resources' element={<Resources />} />
          <Route path='/link' element={<EvidenceLink />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className='footer'>
        <small>
          © {new Date().getFullYear()} BocaSafe • For defense and support only.
          Don’t pay. Don’t send more. Preserve evidence.
        </small>
      </footer>
    </div>
  );
}
