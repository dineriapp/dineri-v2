import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Metadata } from 'next';
import ResetPasswordPage from '../_components/reset-password';

export const metadata: Metadata = {
    title: "Reset Password",
};

const Page = () => {
    return (
        <>
            <Header />
            <ResetPasswordPage />
            <Footer />
        </>
    )
}

export default Page
