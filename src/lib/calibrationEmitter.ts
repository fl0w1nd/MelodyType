type CalibrationListener = () => void

const listeners = new Set<CalibrationListener>()

export function startCalibration() {
  listeners.forEach((fn) => fn())
}

export function subscribeCalibration(fn: CalibrationListener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
