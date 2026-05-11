// /* eslint-disable react/prop-types */
// export default function UserTable({ data, text, onAddUser }) {
//   return (
//     <div className="table-container">
//       <div className="table-header-bar">
//         <h3>Recent Enrollments</h3>

//         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//           <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
//             Showing last {data?.length || 0} records
//           </span>

//           {/* The Add Button */}
//           <button className="btn-add-user" onClick={onAddUser}>
//             <span>+</span> {text}
//           </button>
//         </div>
//       </div>

//       <table className="custom-table">
//         <thead>
//           <tr>
//             <th>S/N</th>
//             <th>Reg Number</th>
//             <th>Name</th>
//             <th>IT Type</th>
//             <th>Date</th>
//           </tr>
//         </thead>
//         <tbody>
//           {data && data.length > 0 ? (
//             data.map((user, index) => (
//               <tr key={user.sn || index}>
//                 <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
//                 <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{user.regno}</td>
//                 <td>{user.name}</td>
//                 <td>
//                   <span className={`badge ${user.itype === 'SIWES' ? 'badge-siwes' : 'badge-nysc'}`}>
//                     {user.itype}
//                   </span>
//                 </td>
//                 <td style={{ color: 'var(--text-muted)' }}>
//                   {new Date(user.enrolled_date).toLocaleDateString()}
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="5" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
//                 No enrollment data available.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }


/* eslint-disable react/prop-types */
export default function UserTable({ data, text, onAddUser }) {
  return (
    <div className="table-container">
      <div className="table-header-bar">
        <h3>Recent Enrollments</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing last {data?.length || 0} records
          </span>

          <button className="btn-add-user" onClick={onAddUser}>
            <span>+</span> {text}
          </button>
        </div>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>Reg Number</th>
            <th>Name</th>
            <th>IT Type</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {data && data.length > 0 ? (
            data.map((user) => (
              <tr key={user.regno}>
                {/* REGNO is now the UNIQUE IDENTIFIER */}
                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                  {user.regno}
                </td>

                <td>{user.name}</td>

                <td>
                  <span
                    className={`badge ${
                      user.itype === 'SIWES'
                        ? 'badge-siwes'
                        : 'badge-nysc'
                    }`}
                  >
                    {user.itype}
                  </span>
                </td>

                <td style={{ color: 'var(--text-muted)' }}>
                  {new Date(user.enrolled_date).toLocaleDateString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="4"
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: 'var(--text-muted)',
                }}
              >
                No enrollment data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
