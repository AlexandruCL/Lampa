import { useParams } from "react-router";
import Join from "../phone/Join";

export default function Site() {
  const { siteId } = useParams();
  return <Join siteId={siteId} />;
}
