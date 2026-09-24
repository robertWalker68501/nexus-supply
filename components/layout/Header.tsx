import Navbar from '../navigation/Navbar';

const Header = () => {
  return (
    <header className='border-border sticky top-0 z-50 border-b bg-zinc-200/10 py-4 backdrop-blur-2xl dark:bg-zinc-900/50'>
      <div className='page-wrapper'>
        <Navbar />
      </div>
    </header>
  );
};

export default Header;
