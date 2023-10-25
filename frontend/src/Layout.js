import {Outlet} from 'react-router-dom'
import useStore from "./store"
import './Layout.css'


const Layout = () => {
    const {platform} = useStore()
    const _style = platform === 'web' ?  {} : {padding: '40px 0 0'}
    return(
        <main className={`App Layout-${platform}`}>
            <Outlet />
        </main>
    )
}

export default Layout