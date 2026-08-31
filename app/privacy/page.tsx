export const metadata = {
  title: "Privacy Policy — Life Dashboard",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl w-full p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p>
        Life Dashboard is a personal, single-user application. It is not a
        public product and has no users other than its owner.
      </p>
      <p>
        Any data it reads from connected services (such as WHOOP) is used
        solely to display it back to the owner within this application. It is
        not shared with, sold to, or processed by any third party, and is not
        used for any purpose beyond rendering the owner&apos;s own dashboard.
      </p>
    </main>
  );
}
