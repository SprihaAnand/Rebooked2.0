import React from "react";
import Layout from "../../components/Shared/Layout/Layout";
import { useSelector } from "react-redux";

const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <Layout>
      <div className="container">
        <div className="d-felx flex-column mt-4">
          <h1>
            Welcome Admin <i className="text-success">{user?.name}</i>
          </h1>
          <h3>Rebooked </h3>
          <hr />
          <p>
          Without a middleman or inventory, we want to build a platform that connects people who want to trade, buy, sell, or donate books. By collaborations with school and college administration, we seek to spread the word about the accessibility of low-cost books and emphasis the value of education and literacy. By making books more accessible and inexpensive, we hope to increase literacy rates and equip kids with the skills they need to excel in the classroom and beyond. Our platform encourages a more ecologically friendly approach to book consumption while being a cost-effective and sustainable means to provide access to books. We intend to reduce waste by enticing people to reuse and recycle books rather than buy new ones encourage everyone to live in a sustainable future.Overall, we are enthusiastic about the project's potential effects, the chance to increase disadvantaged school children' access to affordable books, and the chance to enhance their education. We want to leave a positive legacy that people and communities can take advantage of for years to come.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHome;