import React, { useRef, useEffect } from 'react'
import { sample } from 'poisson-process'

/* https://overreacted.io/making-setinterval-declarative-with-react-hooks/ */
function useInterval (callback, delay) {
  const savedCallback = useRef()
  useEffect(
    () => {
      savedCallback.current = callback
    },
    [callback]
  )
  useEffect(
    () => {
      function tick () {
        savedCallback.current()
      }
      if (delay !== null) {
        let id = setInterval(tick, delay)
        return () => clearInterval(id)
      }
    },
    [delay]
  )
}

function usePoissonProcess (cb, rate) {
  useInterval(cb, sample(rate))
}

export { usePoissonProcess }
