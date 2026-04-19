import confetti from 'canvas-confetti'

export function fireConfetti() {
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316']
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 }, colors })
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors }), 150)
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors }), 300)
}

export function playApplause() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(1, now)
    master.connect(ctx.destination)

    // ── 함성 (와아아~) ──────────────────────────────────────────
    // 군중 목소리 = 화이트노이즈 + 보컬 포먼트 필터
    const cheerDur = 2.2
    const cheerBuf = ctx.createBuffer(2, ctx.sampleRate * cheerDur, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = cheerBuf.getChannelData(ch)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    const cheerSrc = ctx.createBufferSource()
    cheerSrc.buffer = cheerBuf

    // "와아" 모음 포먼트: F1=700Hz, F2=1100Hz, 고음성분=2500Hz
    const formants = [700, 1100, 2500]
    const formantGains = [0.25, 0.18, 0.08]
    formants.forEach((freq, i) => {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = freq
      bp.Q.value = freq < 1000 ? 3 : 5
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(formantGains[i], now + 0.15)
      g.gain.setValueAtTime(formantGains[i], now + 1.4)
      g.gain.linearRampToValueAtTime(0, now + cheerDur)
      cheerSrc.connect(bp)
      bp.connect(g)
      g.connect(master)
    })

    // 피치 라이징 느낌: 로우쉘프로 저역 강조가 올라가는 효과
    const riseFilter = ctx.createBiquadFilter()
    riseFilter.type = 'highshelf'
    riseFilter.frequency.setValueAtTime(800, now)
    riseFilter.frequency.linearRampToValueAtTime(2000, now + 0.4)
    riseFilter.gain.setValueAtTime(-6, now)
    riseFilter.gain.linearRampToValueAtTime(3, now + 0.4)

    cheerSrc.start(now)
    cheerSrc.stop(now + cheerDur)

    // ── 박수 소리 ──────────────────────────────────────────────
    // 군중 박수 = 30개 개별 박수 랜덤 타이밍으로 겹치게
    const totalClaps = 30
    const clapWindow = 1.6 // 1.6초 동안 분포

    for (let i = 0; i < totalClaps; i++) {
      const t = now + 0.05 + (i / totalClaps) * clapWindow + (Math.random() - 0.5) * (clapWindow / totalClaps) * 2
      const clapDur = 0.035 + Math.random() * 0.045
      const bufLen = Math.floor(ctx.sampleRate * clapDur)

      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let j = 0; j < bufLen; j++) {
        const env = Math.exp(-j / (bufLen * 0.3)) // 빠른 지수 감쇠
        d[j] = (Math.random() * 2 - 1) * env
      }

      const src = ctx.createBufferSource()
      src.buffer = buf

      // 박수 주파수 대역: 1kHz ~ 4kHz
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 900 + Math.random() * 600

      const bp = ctx.createBiquadFilter()
      bp.type = 'peaking'
      bp.frequency.value = 2000 + Math.random() * 1500
      bp.Q.value = 1.5
      bp.gain.value = 6

      // 좌우 패닝으로 공간감
      const panner = ctx.createStereoPanner()
      panner.pan.value = (Math.random() * 2 - 1) * 0.8

      const g = ctx.createGain()
      g.gain.setValueAtTime(0.5 + Math.random() * 0.5, t)

      src.connect(hp)
      hp.connect(bp)
      bp.connect(panner)
      panner.connect(g)
      g.connect(master)
      src.start(t)
      src.stop(t + clapDur)
    }

    // ── 짧은 딜레이 에코 (공간감) ──────────────────────────────
    const delay = ctx.createDelay(0.3)
    delay.delayTime.value = 0.12
    const echoGain = ctx.createGain()
    echoGain.gain.value = 0.18
    master.connect(delay)
    delay.connect(echoGain)
    echoGain.connect(ctx.destination)

  } catch {
    // AudioContext 미지원 환경에서 무시
  }
}

export function celebrate(name?: string | null) {
  fireConfetti()
  playApplause()

  if (name && typeof speechSynthesis !== 'undefined') {
    const speak = () => {
      const msg = new SpeechSynthesisUtterance(`${name}!!!`)
      msg.lang = 'ko-KR'
      msg.rate = 0.6
      msg.pitch = 1.4
      msg.volume = 1.0

      const voices = speechSynthesis.getVoices()
      // 남성 음성 우선 (Kyunghoon 등), 없으면 ko-KR 아무거나
      const maleVoice =
        voices.find(v => v.lang.startsWith('ko') && /kyunghoon|male|남성|man/i.test(v.name)) ??
        voices.find(v => v.lang.startsWith('ko'))
      if (maleVoice) msg.voice = maleVoice

      speechSynthesis.cancel()
      speechSynthesis.speak(msg)
    }

    // getVoices()는 비동기 로딩 — 이미 로드됐으면 바로, 아니면 이벤트 대기
    if (speechSynthesis.getVoices().length > 0) {
      speak()
    } else {
      speechSynthesis.addEventListener('voiceschanged', speak, { once: true })
    }
  }
}
