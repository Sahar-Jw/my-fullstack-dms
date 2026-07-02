import Link from "next/link"

function Form({inputs, text, linkTo, linkText ,title,subtitle, btnText}) {
  return (
    <form className="bg--ink-100 w-[450px] h-fit flex flex-col justify-center items-center gap-4 rounded-lg py-14 px-9 shadow-lg">
        <h1 className="text-2xl font-bold">
            {title}
        </h1>
        <p className="text-sm mb-3">
            {subtitle}
        </p>
        {inputs.map((input,index) => {
            return(
                <div className="flex flex-col justify-end gap-1 w-full mb-4" key={index}>
                <label htmlFor={input.name} className="text-sm font-medium text-left">
                    {input.label}
                </label>
                <input key={index} type={input.type} placeholder={input.placeholder} name={input.name} className="border border-gray-300 w-full rounded-md py-2 px-4 focus:outline--ink-500 " />
                </div>
            )
        })}
      <p className="text-sm">
        {text}
        <Link href={linkTo} className="font-bold underline">
          {linkText}
        </Link>
      </p>
      <button className="bg--ink-900 text-white w-[200px] mt-3 py-2 px-4 rounded-md hover:bg--ink-800 hover:cursor-pointer  focus:outline-none focus:ring-2 focus:ring-blue-500">
        {btnText}
      </button>
    </form>
  )
}

export default Form
