import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Metadata } from 'next';
import SigninPage from '../../_components/signin-page';

export const metadata: Metadata = {
    title: "Sign in",
};

const Page = () => {
    return (
        <>
            <Header />
            <SigninPage />
            <Footer />
        </>
    )
}

export default Page
