import SignInUserForm from '@/components/auth/forms/SignInUserForm';

const SignInPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) => {
  const { callbackURL } = await searchParams;
  return (
    <div className='w-full'>
      <SignInUserForm callbackURL={callbackURL} />
    </div>
  );
};

export default SignInPage;
