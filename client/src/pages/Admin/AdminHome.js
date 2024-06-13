import React from "react";
import Layout from "../../components/Shared/Layout/Layout";
import { useSelector } from "react-redux";
import './adminhome.css'
const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <Layout>
 <div className="start">

<body>
  
   <div className="intro-header">
       <div className="container">

           <div className="row">
               <div className="col-lg-8">
                   <div className="intro-message">   
                       <h1 className="animated slideInLeft">"Books are a uniquely portable magic"<br></br>
                       <span className="highlight"> — Stephen King</span>.</h1>
                     <h3 className="animated slideInRight">Know more about this project.</h3>
                     
                         <ul className="list-inline intro-social-buttons">
                           <li>
                                <a href="#"><button className="button animated bounceInUp btn btn-info btn-lg"> <span className="network-name">Github</span></button></a>
                           </li>
                           
                           
                       </ul>
                    
                    
                     
             </div> 
               </div>
             <div className="col-lg-4"></div>
           </div>

       </div>

   
   </div>
  
</body>
</div>
     

    </Layout>
  );
};

export default AdminHome;