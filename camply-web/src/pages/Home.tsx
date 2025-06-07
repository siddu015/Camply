import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
        <main className="container-padding max-w-7xl mx-auto flex items-center justify-center min-h-screen">
            <h1>Your Camply Space</h1>
        </main>
    </div>
  );
};

export default Home; 