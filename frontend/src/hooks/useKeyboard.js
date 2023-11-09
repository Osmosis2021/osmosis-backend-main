import {Capacitor} from "@capacitor/core"
import  { Keyboard } from '@capacitor/keyboard'

const useKeyboard = () => {
    const manageKeyboard = (scrollToId='') => {   
        // hide bottom navbar while keyboard is showing, and scroll the `scrollToId` element to top if given
        if (Capacitor.isNativePlatform()) {
            Keyboard.addListener('keyboardDidShow', info => {
                const bottomNav = document.getElementById('BottomNav')
                bottomNav.style.display = 'none'
                if (scrollToId) {
                    const element = document.getElementById(scrollToId)
                    element.scrollIntoView(true, {behavior: 'smooth'})
                }
            })
            Keyboard.addListener('keyboardWillHide', info => {
                const bottomNav = document.getElementById('BottomNav')
                bottomNav.style.display = 'flex'
            })
        }
    }
    return manageKeyboard
}

export default useKeyboard