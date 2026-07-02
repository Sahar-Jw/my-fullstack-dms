import Form from '../../../components/Form'

export default function Login() {
  const inputs = [
    {
      type: "email",
      placeholder: "Enter your email",
      name: "email",
      label: "Email"
    },
    {
      type: "password",
      placeholder: "••••••••••",
      name: "password",
      label: "Password"

    }
  ]
  return (
    <div className="bg--ink-700 w-full h-screen flex justify-center items-center">
      <Form 
        inputs={inputs} 
        title="Log In" 
        subtitle="Please fill in this form to create an account." 
        btnText="Log In" 
        linkTo="/" 
        text="Don't have an account?  " 
        linkText='Register'/>
    </div>
  )
}
