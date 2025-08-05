import { useState, useEffect } from 'react';
import Head from 'next/head';
import AuthGuard from '../components/AuthGuard';
import Navigation from '../components/Navigation';
import { getAllItems, updateItemById } from '../utils/listDonApi';
import QRCodeGeneratorSimple from '../components/QRCodeGeneratorSimple';
import io from 'socket.io-client';
import copy from 'copy-to-clipboard';
function ManagerContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [deFaultItems, setDeFaultItems] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [lastChangeId, setLastChangeId] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
  }, []);
  const flattenItems = (originalItems) => {
    const flattenedItems = [];

    originalItems.forEach(item => {
      // Nếu item có items con
      if (item.items && Array.isArray(item.items) && item.items.length > 0) {
        // Tách từng item con
        item.items.forEach(subItem => {
          flattenedItems.push({
            ...item,
            soLuongVungtheu: item.items.length,
            // Giữ lại các thông tin khác từ item cha nếu cần
            items: { ...subItem }
          });


        });
      } else {
        // Nếu không có items con, giữ nguyên item gốc
        flattenedItems.push(item);
      }
    });


    return flattenedItems;
  };
  // Đóng modal khi nhấn ESC
  useEffect(() => {
    if (!selectedSubItem) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedSubItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSubItem]);

  // Fetch all items (orders)
  const fetchItems = async () => {
    console.log("fetchItems.............");

    setLoading(true);
    try {
      const data = await getAllItems();
      if (data.success) {
        setDeFaultItems(data.data);
        setItems(flattenItems(data.data));
      } else {
        setItems([]);
      }
    } catch (error) {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    // Không cần cleanup MongoDB Change Stream vì nó chạy ở server level
    const handleBeforeUnload = () => {
      // Chỉ cleanup Socket.IO connection
      if (window.socket) {
        window.socket.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Khởi tạo Socket.IO server trước, sau đó mới kết nối client
    const initSocketAndChangeStream = async () => {
      try {
        // 1. Khởi tạo Socket.IO server trước
        console.log('Initializing Socket.IO server...');
        await fetch('/api/socket');

        // 2. Sau đó kết nối client
        if (window.socket && window.socket.connected) {
          console.log('Using existing socket connection');
          window.socket.off('listDonChanged');
          window.socket.on('listDonChanged', (data) => {
            console.log('ListDon changed:', data);

            // Kiểm tra nếu đây là change mới (tránh duplicate)
            if (data.changeId && data.changeId !== lastChangeId) {
              console.log('New change detected, fetching items...');
              setLastChangeId(data.changeId);
              fetchItems();
            } else {
              console.log('Duplicate change ignored');
            }
          });
        } else {
          console.log('Creating new socket connection for manager');
          const socket = io({ path: '/api/socketio' });

          socket.on('connect', () => {
            console.log('Manager socket connected');
            window.socket = socket;
          });

          socket.on('listDonChanged', (data) => {
            console.log('ListDon changed:', data);

            // Kiểm tra nếu đây là change mới (tránh duplicate)
            if (data.changeId && data.changeId !== lastChangeId) {
              console.log('New change detected, fetching items...');
              setLastChangeId(data.changeId);
              fetchItems();
            } else {
              console.log('Duplicate change ignored');
            }
          });

          socket.on('connect_error', (error) => {
            console.log('Manager socket connection error:', error);
          });
        }

        // MongoDB Change Stream đã được khởi tạo tự động khi server start
        console.log('Socket.IO connected successfully');
      } catch (error) {
        console.error('Error initializing socket and change stream:', error);
      }
    };

    initSocketAndChangeStream();

    // Cleanup khi component unmount
    return () => {
      // Xóa event listener để tránh memory leak
      if (window.socket) {
        window.socket.off('listDonChanged');
      }

      // Xóa beforeunload listener
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Không cần stop MongoDB Change Stream vì nó chạy ở server level
      console.log('Manager component unmounted');
    };
  }, []);

  // Lấy tất cả item con có status rỗng
  const items_doi_thiet_ke = items.filter(item => (item.items.status === "" && item.items.userThietKe === ""));
  const items_dang_thiet_ke = items.filter(item => (item.items.status === "" && item.items.userThietKe !== ""));
  const items_doi_Lam_mech = items.filter(item => item.items.status === "doiLamKhuon");
  const items_doi_theu = items.filter(item => item.items.status === "doiTheu" && item.items.userThietKe === "");
  const items_dang_theu = items.filter(item => item.items.status === "doiTheu" && item.items.userThietKe !== "");
  const listALL = [
    { nameHienThi: "chờ thiết kế", value: items_doi_thiet_ke, nameUser: false },
    { nameHienThi: "đang thiết kế", value: items_dang_thiet_ke, nameUser: "userThietKe" },
    { nameHienThi: "làm khuôn", value: items_doi_Lam_mech, nameUser: "userLamKhuon" },
    { nameHienThi: "đợi thêu", value: items_doi_theu, nameUser: false },
    { nameHienThi: "đang thêu", value: items_dang_theu, nameUser: "userTheu" }

  ]
  // Lấy các item con cùng orderId
  const getSubItemsByOrderId = (orderId) => {
    return items
      .filter(item => item.orderId === orderId && Array.isArray(item.items))
      .flatMap(item => item.items.map(sub => ({ parent: item, sub })));
  };


  const doiTrangThaiItem = async (trangThai, selectedSubItem, content) => {
    let activeItem = deFaultItems.find(item => item.barcode == selectedSubItem.barcode);
    if (trangThai === "chờ Thiết kế") {
      activeItem.items.forEach(item => {
        if (item.positionTheu == selectedSubItem.items.positionTheu) {
          item.status = "";
          item.userThietKe = "";
          item.userLamKhuon = "";
          item.userTheu = "";
          item.idMayTheu = "";

        }

      })
    }
    else if (trangThai === "chờ Làm Khuôn")
      activeItem.items.forEach(item => {
        if (item.positionTheu == selectedSubItem.items.positionTheu) {
          item.status = "doiLamKhuon";
          item.userLamKhuon = "";
          item.userTheu = "";
          item.idMayTheu = "";

        }

      })
    else if (trangThai === "chờ Thêu")
      activeItem.items.forEach(item => {
        if (item.positionTheu == selectedSubItem.items.positionTheu) {
          item.status = "doiTheu";
          item.userTheu = "";
          item.idMayTheu = "";

        }

      })
    else if (trangThai === "sửa note")
      activeItem.items.forEach(item => {
        if (item.positionTheu == selectedSubItem.items.positionTheu) {
          item.status1 = content;
        }
      })

    let { _id, ...updateData } = activeItem;
    const updateResult = await updateItemById(_id, updateData);
    setSelectedSubItem(null)

  }
  console.log(selectedSubItem);

  // Modal hiển thị chi tiết
  const renderModal = () => {
    if (!selectedSubItem) return null;

    // Tính tổng length của tất cả phần tử trong mảng stopLess
    let slMuiTheu = 0;
    if (selectedSubItem.items?.stopLess && Array.isArray(selectedSubItem.items.stopLess)) {
      slMuiTheu = selectedSubItem.items.stopLess.reduce((total, item) => {
        return total + (Array.isArray(item) ? item.length : 0);
      }, 0);
    }
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
        onClick={() => setSelectedSubItem(null)}
      >
        <div style={{ background: '#fff', borderRadius: 10, width: '70vw', height: '80vh', padding: 32, boxShadow: '0 4px 24px #0002', position: 'relative', overflowY: 'auto', minWidth: 350, maxWidth: '90vw', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedSubItem(null)} style={{ position: 'absolute', top: 10, right: 16, background: 'none', border: 'none', fontSize: 32, cursor: 'pointer' }}>&times;</button>
          <h2 style={{ fontSize: '1.7rem', marginBottom: 24 }}>Chi tiết đơn hàng</h2>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 32, flex: 1, minHeight: 0 }}>
            {/* Cột thông tin */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div onClick={() => copy(selectedSubItem.orderId)} style={{ marginBottom: 8, cursor: 'pointer' }}><b>Order:</b> {selectedSubItem.orderId || 'N/A'}</div>
              <div onClick={() => copy(selectedSubItem.barcode)} style={{ marginBottom: 8, cursor: 'pointer' }}><b>barcode:</b> {selectedSubItem.barcode || 'N/A'}</div>
              <div style={{ marginBottom: 8 }}><b>Sản phẩm:</b> {selectedSubItem.product || 'N/A'}</div>
              <div style={{ marginBottom: 8 }}><b>Ngày:</b> {selectedSubItem.dateItem || 'N/A'}</div>
              <div style={{ marginBottom: 8 }}><b>Đối tác:</b> {selectedSubItem.partner || 'N/A'}</div>
              <div style={{ marginBottom: 8 }}><b>Quốc gia:</b> {selectedSubItem.country || 'N/A'}</div>
              <div style={{ marginBottom: 8 }}><b>Độ ưu tiên:</b> {selectedSubItem.Priority || 'N/A'}</div>
              <div style={{ marginBottom: 8 }}><b>Name ID:</b> {selectedSubItem.nameId || 'N/A'}</div>
              <div onClick={() => copy(selectedSubItem.items.urlEMB)} style={{ marginBottom: 8, cursor: 'pointer' }}><b>url Design:</b> {selectedSubItem.items.urlEMB || 'N/A'}</div>
              <div style={{ marginBottom: 8 }}><b>Số lượng mũi thêu:</b> {slMuiTheu}</div>
              <button className='btn btn-primary mr-2' onClick={() => doiTrangThaiItem("chờ Thiết kế", selectedSubItem)} >Chờ Thiết kế</button>
              <button className='btn btn-primary mr-2' onClick={() => doiTrangThaiItem("chờ Làm Khuôn", selectedSubItem)} >Chờ Làm khuôn</button>
              <button className='btn btn-primary mr-2' onClick={() => doiTrangThaiItem("chờ Thêu", selectedSubItem)} >Chờ Thêu</button>

              <p style={{ marginTop: 10, marginBottom: 0 }}><b>ghi chú:</b></p>
              <textarea
                id="noteTextarea"

                defaultValue={selectedSubItem.items.status1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #007bff',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '500px',
                  height: '70px',
                  marginLeft: '8px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}

              />
              <button
                className='btn btn-success mt-2'
                onClick={() => {
                  const textarea = document.getElementById('noteTextarea');
                  const content = textarea.value.trim();

                  doiTrangThaiItem("sửa note", selectedSubItem, content);


                }}
                style={{ marginLeft: '8px' }}
              >
                Lưu Ghi Chú
              </button>
              {/* Danh sách các item con cùng OrderId */}
            </div>

            {/* Cột ảnh thiết kế */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ marginBottom: 16, color: '#2c3e50' }}>Ảnh thiết kế</h3>
              {selectedSubItem.items?.urlEMB ? (
                <div style={{
                  border: '2px solid #e0e0e0',
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: '#f8f9fa',
                  textAlign: 'center'
                }}>
                  <img
                    src={selectedSubItem.items.urlImage}
                    alt="Thiết kế"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: 4
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{
                    display: 'none',
                    padding: '40px 20px',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <div>🖼️</div>
                    <div>Không thể tải ảnh</div>
                    <div style={{ fontSize: '12px', marginTop: 8 }}>
                      {selectedSubItem.items.urlImage}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '2px dashed #e0e0e0',
                  borderRadius: 8,
                  padding: 40,
                  textAlign: 'center',
                  color: '#999'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: 16 }}>🖼️</div>
                  <div>Chưa có ảnh thiết kế</div>
                  <div style={{ fontSize: '12px', marginTop: 8 }}>
                    Ảnh sẽ hiển thị khi có urlEMB
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 'auto', textAlign: 'right' }}>
            <button onClick={() => setSelectedSubItem(null)} style={{ marginTop: 24, padding: '10px 28px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 18, cursor: 'pointer' }}>Đóng</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Quản lý hệ thống</title>
        <meta name="description" content="Trang quản lý hệ thống" />
      </Head>
      <Navigation currentUser={currentUser} />
      {renderModal()}
      <div style={{ display: 'flex', flexDirection: 'row', padding: '20px', height: '90vh', margin: '0 auto', overflowX: 'auto', background: '#232323' }}>

        {/* Cột trái đợi thiết kế................................... */}
        {listALL.map((itemx, idx) => (
          <div key={idx} style={{ width: 300, minWidth: 300, marginRight: 12, background: '#bdbdbd', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 10, height: 'fit-content', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>{itemx.nameHienThi} ({itemx.value.length})</h2>
            {itemx.value.length === 0 ? (
              <div style={{ color: '#888' }}>Không có {itemx.nameHienThi}</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {itemx.value.map((item, id) => (
                  <li key={item._id + '-' + (item.positionTheu || id)} style={{ position: 'relative', marginBottom: 16, padding: 12, borderRadius: 6, cursor: 'pointer', background: '#fff' }}
                    onClick={() => setSelectedSubItem(item)}
                  >
                    {item.items.status1 !== "" && <div style={{ color: 'white', background: "rgb(255 0 0)", fontSize: '1rem', padding: "0px 5px", borderRadius: "5px" }}> {item.items.status1 || ''}</div>}
                    <div style={{ fontWeight: '500', fontSize: '1.3rem', paddingTop: "7px" }}> {item.orderId || 'N/A'}</div>
                    <div><b>Số lượng cái:</b> {item.Quantity || 'N/A'}</div>
                    <div><b>Sản phẩm:</b> {item.product || 'N/A'}</div>
                    <div><b>Ngày:</b> {item.dateItem || 'N/A'}</div>
                    <div><b>Vị trí thêu:</b> {item.items.positionTheu || 'N/A'}</div>
                    {(item.soLuongVungtheu > 1) && <div style={{ position: 'absolute', bottom: 2, right: 2, color: 'red', fontWeight: 'bold', fontSize: '1.5rem' }}>{item.soLuongVungtheu || 'N/A'}</div>}
                    {(item.items.idMayTheu !== "") && <div style={{ position: 'absolute', top: 0, left: 0, color: 'red', fontWeight: 'bold', fontSize: '1rem', background: "#0d6efd", borderRadius: "5px", color: "#FFF" }}>{item.items.idMayTheu || 'N/A'}</div>}
                    {item.items[itemx.nameUser] && <div style={{ fontWeight: '500', fontSize: '0.8rem', background: '#ffc107', padding: 4, borderRadius: 4, textAlign: 'center' }}> {item.items[itemx.nameUser] || 'N/A'}</div>}

                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}





      </div>
    </>
  );
}

export default function Manager() {
  return (
    <AuthGuard>
      <ManagerContent />
    </AuthGuard>
  );
} 