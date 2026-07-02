import Form from '../../../components/Form'

export default function Register() {
  const inputs = [
    {
      type: "text",
      placeholder: "Enter your name",
      name: "name",
      label: "Full Name"
    },
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
      title="Register" 
      subtitle="Please fill in this form to create an account." 
      btnText="Register" 
      linkTo="/login" 
      text="Already have an account?  " 
      linkText='Login'/>
    </div>
  )
}
