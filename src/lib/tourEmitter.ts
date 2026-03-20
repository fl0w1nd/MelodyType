type TourListener = () => void

const listeners = new Set<TourListener>()

export function startTour() {
  listeners.forEach((fn) => fn())
}

export function subscribeTour(fn: TourListener) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
