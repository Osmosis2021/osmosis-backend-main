import {Outlet} from 'react-router-dom'
import useStore from "./store"
import './Layout.css'


const Layout = () => {
    const {platform} = useStore()
    return(
        <main className={`App Layout-${platform}`}>
            <Outlet />
        </main>
    )
}

export default Layout