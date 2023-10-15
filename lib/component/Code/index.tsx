import prism from "prismjs";
import styles from "./index.module.css";
import { useEffect } from "react";
import { FunctionComponent } from "react";

interface Props {
  language: string | null;
  text: string | null;
}

const CodeComponent: FunctionComponent<Props> = ({ language, text }) => {
  useEffect(() => {
    prism.highlightAll();
  }, []);

  return (
    <pre className={`${styles.code}`}>
      <code className={`lang-${language}`}>{text}</code>
    </pre>
  );
};

export default CodeComponent;
