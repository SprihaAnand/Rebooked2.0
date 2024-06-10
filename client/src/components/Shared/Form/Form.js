import React, { useState } from 'react';
import InputType from './InputType';

const Form = ({formType, submitBtn, formTitle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("donar");
  const [name, setName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div>
      <form>
        <h1 className='text-center'> {formTitle}</h1>
        <hr/>
        {/* switch statement */}
        {(()=>{
          //eslint-disable-next-line
          switch(true){
            case formType === 'login':{
                return (
                  <>
                    <InputType 
                      labelText={'Email'}
                      labelFor={'forEmail'}
                      inputType={'email'}
                      name={'email'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <InputType 
                      labelText={'Password'}
                      labelFor={'forPassword'}
                      inputType={'password'}
                      name={'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </>
                );
            }
          case formType === 'register':{
            return(
              <>
                <InputType 
                  labelText={'Email'}
                  labelFor={'forEmail'}
                  inputType={'email'}
                  name={'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <InputType 
                  labelText={'Password'}
                  labelFor={'forPassword'}
                  inputType={'password'}
                  name={'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputType
                  labelText={"Name"}
                  labelFor={"forName"}
                  inputType={"text"}
                  name={"name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <InputType
                  labelText={"Organisation Name"}
                  labelFor={"fororganisationName"}
                  inputType={"text"}
                  name={"organisationName"}
                  value={organisationName}
                  onChange={(e) => setOrganisationName(e.target.value)}
                />  
                <InputType
                  labelText={"Institute Name"}
                  labelFor={"forInstituteName"}
                  inputType={"text"}
                  name={"instituteName"}
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                />  
                <InputType
                  labelText={"Website"}
                  labelFor={"forWebsite"}
                  inputType={"text"}
                  name={"website"}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />  
                <InputType
                  labelText={"Address"}
                  labelFor={"forAddress"}
                  inputType={"text"}
                  name={"address"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <InputType
                  labelText={"Phone"}
                  labelFor={"forPhone"}
                  inputType={"text"}
                  name={"phone"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </>
            )
          }
        }
        })()}

        <div className='d-flex'>
          <button type="submit" className="btn btn-primary">{submitBtn}</button>
        </div>
      </form>
    </div>
  );
};

export default Form;
