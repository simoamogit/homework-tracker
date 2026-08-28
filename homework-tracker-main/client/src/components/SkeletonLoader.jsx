import styles from './SkeletonLoader.module.css';

function SkeletonTask() {
  return (
    <div className={styles.task}>
      <div className={`${styles.bone} ${styles.checkbox}`} />
      <div className={styles.taskBody}>
        <div className={`${styles.bone} ${styles.meta}`} />
        <div className={`${styles.bone} ${styles.desc}`} />
      </div>
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div className={styles.group}>
      <div className={`${styles.bone} ${styles.header}`} />
      <div className={`${styles.bone} ${styles.bar}`} />
      <SkeletonTask />
      <SkeletonTask />
      <SkeletonTask />
    </div>
  );
}

export default function SkeletonLoader() {
  return (
    <>
      <SkeletonGroup />
      <SkeletonGroup />
    </>
  );
}