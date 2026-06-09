import { redirect } from 'next/navigation';

export default function WelcomeScreen() {
  // Immediately redirect to the dashboard on the server side
  // to completely bypass the welcome screen for now.
  redirect('/home');
}
