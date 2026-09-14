import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Metadata } from 'next';
import SignUpPage from '../../_components/signup-page';

export const metadata: Metadata = {
    title: "Start free",
};

const Page = async () => {

    return (
        <>
            <Header />
            <SignUpPage />
            <Footer />
        </>
    )
}

export default Page
