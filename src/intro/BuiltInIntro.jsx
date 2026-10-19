import {INTRO} from './config.js'
// Built-in intro: deep forest background, champagne-gold accents, matching the BTS website.
// Replace freely (or use mode 'custom-html' in config.js).
export default function BuiltInIntro(){return<div className="bi">
 <div className="bi-box" style={{'--ms':INTRO.minMs+'ms'}}><div className="bi-mono">BTS</div>
 <h1 className="bi-t">BATRA TRANSPORT SERVICES</h1><div className="bi-s">LUDHIANA · PAN-INDIA ROAD FREIGHT LOGISTICS</div>
 <div className="bi-m"><span>Your Cargo,</span> <b>Our Commitment</b></div><div className="bi-line"/><div className="bi-y">21+ YEARS EXPERIENCE</div>
 <div className="bi-bar" aria-hidden="true"><i/></div></div></div>}