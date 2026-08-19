import { useEffect, useRef } from 'react'

export default function useReveal() {
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                    }
                })
            },
            { threshold: 0.15 }
        )

        const el = ref.current
        if (el) {
            const children = el.querySelectorAll('.reveal, .reveal-left, .reveal-right')
            children.forEach((child, i) => {
                child.style.transitionDelay = `${i * 0.1}s`
                observer.observe(child)
            })
            if (el.classList.contains('reveal') ||
                el.classList.contains('reveal-left') ||
                el.classList.contains('reveal-right')) {
                observer.observe(el)
            }
        }

        return () => observer.disconnect()
    }, [])

    return ref
}