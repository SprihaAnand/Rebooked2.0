import { Link } from "react-router-dom";
import { FiArrowLeft as ArrowLeft, FiBookOpen as BookOpen } from "react-icons/fi";

const NotFoundPage = () => <main className="not-found"><BookOpen aria-hidden="true" /><p className="eyebrow">Page not found</p><h1>That page has wandered off the shelf.</h1><p>Let’s get you back to a place that is still part of the story.</p><Link className="button" to="/"> <ArrowLeft /> Back home</Link></main>;
export default NotFoundPage;
