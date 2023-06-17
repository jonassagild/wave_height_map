
import dynamic from 'next/dynamic';

const DynamicMapWithNoSSR = dynamic(
    () => import('../components/Map'), 
    { ssr: false }
);

export default function Home() {
    return (
        <div>
            <DynamicMapWithNoSSR />
        </div>
    );
}
