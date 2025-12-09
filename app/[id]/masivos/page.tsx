import MasivosContainer from "./container";

export default async function MasivosPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <section>
            <MasivosContainer id={id} />
        </section>
    );
}