import { useState, useEffect } from 'react';
import Head from 'next/head';
import AuthGuard from '../components/AuthGuard';
import Navigation from '../components/Navigation';
import { getDoiThietKeItems, updateItemStatus, updateItemById, getItemById } from '../utils/listDonApi';
import { SERVER_THEU } from '../constants';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';
import copy from 'copy-to-clipboard';

function DesignContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState({
    emptyUserItems: [],
    runningItems: [],
    userActiveItems: false
  });
  const [loading, setLoading] = useState(false);


  // Lấy thông tin user hiện tại
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
  }, []);




  // Hàm tách items con từ items gốc
  const flattenItems = (originalItems) => {
    const flattenedItems = [];

    originalItems.forEach(item => {
      // Nếu item có items con
      if (item.items && Array.isArray(item.items) && item.items.length > 0) {
        // Tách từng item con
        item.items.forEach(subItem => {
          flattenedItems.push({
            ...item,

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

  // Hàm xử lý khi click button "Nhận"
  const activeCardDesign = async (item) => {

    const itemId = item._id;
    // Lấy item từ MongoDB
    const result = await getItemById(itemId);
    if (result.success) {
      console.log('Item từ MongoDB:', result.data);
      let itemsMongo = result.data;
      // Lấy thông tin user hiện tại
      const userInfo = localStorage.getItem('userInfo');
      const currentUser = userInfo ? JSON.parse(userInfo) : null;
      // so sánh positionTheu
      if (item.items && item.items.positionTheu &&
        itemsMongo.items && Array.isArray(itemsMongo.items)) {
        // Duyệt qua tất cả các phần tử trong mảng items
        let foundMatch = false;
        let matchIndex = -1;
        for (let i = 0; i < itemsMongo.items.length; i++) {
          if (itemsMongo.items[i].positionTheu === item.items.positionTheu) {
            console.log(`Tìm thấy positionTheu khớp tại index ${i}!`);
            foundMatch = true;
            matchIndex = i;
            break;
          }
        }
        if (foundMatch) {
          // Cập nhật userThietKe tại index tìm được
          const updateData = {
            [`items.${matchIndex}.userThietKe`]: currentUser ? (currentUser.hoTen || currentUser.vaiTro) : 'Unknown'
          };
          const updateResult = await updateItemById(itemId, updateData);
          if (updateResult.success) {
            // Thông báo cho client khác
            notifyOtherClients();
            // Refresh lại danh sách
            fetchItems();
          } else {
            console.error('Lỗi cập nhật:', updateResult.error);
          }
        } else {
          console.log('Không tìm thấy positionTheu khớp trong mảng items');
        }
      } else {
        console.log('Không tìm thấy positionTheu để so sánh');
      }
      // Hiển thị thông tin item ở đây nếu cần
    }
  };

  // Lấy danh sách items cần thiết kế
  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getDoiThietKeItems();
      if (data.success) {
        console.log("data.data", data.data);
        // Tách items con trước khi set state
        const flattenedItems = flattenItems(data.data);
        // Lọc items theo userThietKe - hiển thị đủ items cùng orderId
        const emptyUserItems = flattenedItems.filter(item => {
          // Nếu item có userThietKe rỗng, hiển thị
          if (item.items && item.items.userThietKe === "" && item.items.status === "") return true;
          // Nếu item có userThietKe không rỗng, kiểm tra xem có item nào cùng orderId có userThietKe rỗng không
          if (item.items && item.items.userThietKe !== "") {
            const hasEmptyUserInSameOrder = flattenedItems.some(otherItem =>
              otherItem.orderId === item.orderId &&
              otherItem.items &&
              otherItem.items.userThietKe === ""
              && otherItem.items.status === ""
            );
            return hasEmptyUserInSameOrder;
          }
          return false;
        });

        const runningItems = flattenedItems.filter(item => item.items && item.items.userThietKe !== "");
        const userActiveItems = flattenedItems.filter(item => item.items && item.items.userThietKe === currentUser?.hoTen && item.items.status === "");
        const itemsFilter = {
          emptyUserItems: emptyUserItems,
          runningItems: runningItems,
          userActiveItems: userActiveItems.length == 0 ? false : userActiveItems[0]
        }
        setItems(itemsFilter);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    }
    setLoading(false);
  };

  // WebSocket connection
  useEffect(() => {
    let socket;

    if (currentUser && currentUser.vaiTro === 'Thiết Kế') {
      // Khởi tạo WebSocket server trước
      fetch('/api/socket');
      // Khởi tạo WebSocket connection
      socket = io({ path: '/api/socketio' });
      // Lưu socket vào window để sử dụng ở mọi nơi
      window.socket = socket;
      // Lắng nghe các events
      socket.on('connect', () => { console.log('WebSocket connected:', socket.id); });
      socket.on('disconnect', () => { console.log('WebSocket disconnected'); });
      socket.on('refreshItems', () => { fetchItems(); });
      // Fetch items ban đầu
      fetchItems();
    }
    // Cleanup khi component unmount hoặc dependencies thay đổi
    return () => { if (socket) { socket.disconnect(); } };
  }, [currentUser?.vaiTro]);

  // Hàm thông báo cho client khác
  const notifyOtherClients = () => {
    console.log('Thông báo cho client khác...');
    // Sử dụng socket connection hiện tại nếu có
    if (window.socket && window.socket.connected) {

      window.socket.emit('fetchItems');
    } else {
      console.log('Creating new socket connection for notification');
      const socket = io({ path: '/api/socketio' });

      socket.on('connect', () => {
        socket.emit('fetchItems');
        socket.disconnect();
      });

      socket.on('error', (error) => {
        console.error('Notify socket error:', error);
      });
    }
  };
  async function createFolderEMB(items) {
    try {
      console.log('Tạo thư mục EMB cho:', items);

      const requestData = {
        orderId: items.orderId,
        barcode: items.barcode,
        variant: items.items.positionTheu
      };

      console.log('Dữ liệu gửi đi:', requestData);

      const response = await fetch(`${SERVER_THEU.BASE_URL}/createFolderEMB`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const resultURL = await response.json();
        console.log('Kết quả tạo thư mục:', resultURL.path);


        // Lấy item từ MongoDB
        const resultItemMongo = await getItemById(items._id);
        console.log(resultItemMongo);

        // Kiểm tra và cập nhật urlEMB nếu resultItemMongo.success là true
        if (resultItemMongo.success && resultItemMongo.data && resultItemMongo.data.items) {
          console.log('Kiểm tra positionTheu và cập nhật urlEMB...');

          // Tìm phần tử có positionTheu giống nhau trong mảng items
          const targetPositionTheu = items.items.positionTheu;
          console.log('PositionTheu cần tìm:', targetPositionTheu);

          // Duyệt qua mảng items trong MongoDB
          for (let i = 0; i < resultItemMongo.data.items.length; i++) {
            const mongoItem = resultItemMongo.data.items[i];
            console.log(`Kiểm tra item ${i}:`, mongoItem);

            if (mongoItem.positionTheu === targetPositionTheu) {
              console.log(`Tìm thấy positionTheu khớp tại index ${i}!`);


              // Thay thế urlEMB
              resultItemMongo.data.items[i].urlEMB = resultURL.path;

              console.log('Đã cập nhật urlEMB thành công!');

              break;
            }
          }

          console.log('Kết quả cuối cùng:', resultItemMongo.data);

          // Cập nhật lại vào MongoDB - chỉ gửi phần items đã được cập nhật
          const updateData = {
            items: resultItemMongo.data.items
          };
          const updateResult = await updateItemById(items._id, updateData);

          if (updateResult.success) {
            console.log('Đã cập nhật urlEMB thành công!');

            // Thông báo cho client khác
            notifyOtherClients();
            // Refresh lại danh sách
            fetchItems();
          } else {

            alert('Tạo thư mục thành công nhưng lỗi khi cập nhật urlEMB!');
          }
        } else {
          console.log('Không thể lấy dữ liệu từ MongoDB hoặc không có items');
        }


      } else {
        console.error('Lỗi khi tạo thư mục:', response.status, response.statusText);
        alert('Lỗi khi tạo thư mục EMB!');
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      alert('Lỗi kết nối khi tạo thư mục EMB!');
    }
  }

  async function HuyLamItem(userActiveItem) {
    try {
      const resultItemMongo = await getItemById(userActiveItem._id);
      if (resultItemMongo.success && resultItemMongo.data && resultItemMongo.data.items) {
        const targetPositionTheu = userActiveItem.items.positionTheu;
        for (let i = 0; i < resultItemMongo.data.items.length; i++) {
          const mongoItem = resultItemMongo.data.items[i];
          if (mongoItem.positionTheu === targetPositionTheu) {
            resultItemMongo.data.items[i].userThietKe = "";
            break;
          }
        }
        const updateData = {
          items: resultItemMongo.data.items
        };
        const updateResult = await updateItemById(userActiveItem._id, updateData);
        if (updateResult.success) {
          console.log('Đã hủy làm item thành công!', updateResult);
          // Thông báo cho client khác
          notifyOtherClients();
          // Refresh lại danh sách
          fetchItems();
        } else {
          alert('Lỗi khi hủy làm item!');
        }
      } else {
      }
    } catch (error) {
      alert('Lỗi khi hủy làm item!');
    }
  }
  async function HoanThanhItem(userActiveItem) {
    console.log("userActiveItem", userActiveItem);
    console.log(JSON.stringify({
      folderPath: userActiveItem.items.urlEMB,
      ActiveItem: userActiveItem
    }));
if(userActiveItem.items.urlEMB==""){
  alert("Vui lòng tạo thư mục EMB trước khi hoàn thành!");
  return;
}
    // Kiểm tra file .EMB trong thư mục
    if (userActiveItem.items?.urlEMB) {
      try {
        const response = await fetch(`${SERVER_THEU.BASE_URL}/checkHaveEMBFile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folderPath: userActiveItem.items.urlEMB,
            ActiveItem: userActiveItem
          })
        });

        if (response.ok) {
          const result = await response.json();


          if (!result.data) {
            alert(result.message || 'Thư mục không có file .EMB! Vui lòng kiểm tra lại.');
            return;
          }
        } else {
          const errorResult = await response.json();
          alert(errorResult.error || 'Lỗi khi kiểm tra file .EMB!');
          return;
        }
      } catch (error) {
        alert('Lỗi kết nối khi kiểm tra file .EMB!');
        return;
      }
    }

    try {
      const resultItemMongo = await getItemById(userActiveItem._id);
      if (resultItemMongo.success && resultItemMongo.data && resultItemMongo.data.items) {
        const targetPositionTheu = userActiveItem.items.status;
        for (let i = 0; i < resultItemMongo.data.items.length; i++) {
          const mongoItem = resultItemMongo.data.items[i];
          if (mongoItem.status === targetPositionTheu) {
            resultItemMongo.data.items[i].status = "doiLamKhuon";
            break;
          }
        }
        const updateData = {
          items: resultItemMongo.data.items
        };
        const updateResult = await updateItemById(userActiveItem._id, updateData);
        if (updateResult.success) {
          console.log('Đã hoàn thành item thành công!', updateResult);
          // Thông báo cho client khác
          notifyOtherClients();
          // Refresh lại danh sách
          fetchItems();
        } else {
          alert('Lỗi khi hoàn thành item!');
        }
      } else {
      }
    } catch (error) {
      alert('Lỗi khi hoàn thành item!');
    }
  }


  return (
    <>
      <Head>
        <title>Thiết kế thêu</title>
        <meta name="description" content="Thiết kế thêu" />
      </Head>
      <Navigation currentUser={currentUser} />

      <div className="container">
        <div className="row">
          <div className="col-3">
            <h3 className="mb-3">Danh sách đơn hàng</h3>
            {items.emptyUserItems.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {items.emptyUserItems.map((item, index) => (
                  <div
                    key={index}
                    className="card position-relative"
                    style={{
                      backgroundColor: item.items?.status != "" ? '#51ff7d' : 'white'
                    }}
                  >
                    {/* Badge số lượng - chỉ hiển thị khi khác 1 */}
                    {item.Quantity && item.Quantity !== 1 && (
                      <div
                        className="position-absolute top-0 end-0"
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '0 0.375rem 0 0.375rem',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          zIndex: 1
                        }}
                      >
                        {item.Quantity}
                      </div>
                    )}
                    <div className="card-body p-2">
                      <h6 className="card-title mb-1">Order: {item.orderId || 'N/A'}</h6>
                      <p className="card-text mb-1">
                        <small className="text-muted">Ngày: {item.dateItem || 'N/A'}</small>
                      </p>
                      <p className="card-text mb-1">
                        <small>Sản phẩm: {item.product || 'N/A'}</small>
                      </p>
                      <p className="card-text mb-0">
                        <small>Biến thể: {item.variant || 'N/A'}</small>
                      </p>
                      {/* Button Nhận - chỉ hiển thị khi không có userActiveItems và status không phải doiLamKhuon */}
                      {(!items.userActiveItems || items.userActiveItems.length === 0) &&
                        item.items?.status === "" && (
                          <button
                            onClick={() => activeCardDesign(item)}
                            className="btn btn-success btn-sm mt-2 w-100"
                            style={{ fontSize: '12px' }}
                          >
                            Nhận
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">
                {loading ? 'Đang tải...' : 'Không có đơn hàng nào'}
              </div>
            )}
          </div>
          <div className="col-9">
            <h1>Thiết kế</h1>

            {/* Hiển thị thông tin item đang active */}
            {items.userActiveItems && (
              <div>
                <div className="card mb-4">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Đơn hàng đang thiết kế</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6>Thông tin đơn hàng:</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>Order ID:</strong></td>
                              <td>{items.userActiveItems.orderId}</td>
                            </tr>
                            <tr>
                              <td><strong>Product:</strong></td>
                              <td>{items.userActiveItems.product}</td>
                            </tr>
                            <tr>
                              <td><strong>Variant</strong></td>
                              <td>{items.userActiveItems.variant}</td>
                            </tr>

                            <tr>
                              <td><strong>Số lượng:</strong></td>
                              <td>{items.userActiveItems.Quantity}</td>
                            </tr>

                            <tr>
                              <td><strong>Quốc gia:</strong></td>
                              <td>{items.userActiveItems.country}</td>
                            </tr>

                            <tr>
                              <td><strong>Đối tác:</strong></td>
                              <td>{items.userActiveItems.partner}</td>
                            </tr>
                            <tr>
                              <td><strong>Ngày:</strong></td>
                              <td>{items.userActiveItems.dateItem}</td>
                            </tr>
                            <tr>
                              <td><strong>Độ ưu tiên:</strong></td>
                              <td>{items.userActiveItems.Priority}</td>
                            </tr>
                            <tr>
                              <td><strong>Name ID:</strong></td>
                              <td>{items.userActiveItems.nameId}</td>
                            </tr>
                            <tr>
                              <td><strong>Barcode:</strong></td>
                              <td>{items.userActiveItems.barcode}</td>
                            </tr>
                          </tbody>
                        </table>
                        <button className="btn btn-primary" onClick={() => HuyLamItem(items.userActiveItems)}>Không làm nữa :V </button>
                        <button className="btn btn-primary" onClick={() => HoanThanhItem(items.userActiveItems)}>hoàn thành </button>
                      </div>
                      <div className="col-md-6">
                        <h6>Thông tin thiết kế:</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>URL Image:</strong></td>
                              <td>
                                <a href={items.userActiveItems.items?.urlImage + "?download=yes"} target="_blank" rel="noopener noreferrer">
                                  Xem hình ảnh
                                </a>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Vị trí thêu:</strong></td>
                              <td>{items.userActiveItems.items?.positionTheu}</td>
                            </tr>
                            <tr>
                              <td><strong>User thiết kế:</strong></td>
                              <td>{items.userActiveItems.items?.userThietKe}</td>
                            </tr>

                          </tbody>
                        </table>
                        {/* Hiển thị hình ảnh thiết kế */}
                        {items.userActiveItems.items?.urlImage && (
                          <div className="mt-3">
                            <h6>Hình ảnh thiết kế:</h6>
                            <img
                              src={items.userActiveItems.items.urlImage}
                              alt="Thiết kế"
                              className="img-fluid border rounded"
                              style={{ maxHeight: '300px' }}
                            />
                          </div>
                        )}


                      </div>
                    </div>


                  </div>
                </div>

                {/* Kiểm tra urlEMB và hiển thị tương ứng */}
                {items.userActiveItems.items?.urlEMB && items.userActiveItems.items.urlEMB !== "" ? (
                  <div className="mt-3">
                    <h6>Thư mục EMB đã tạo:</h6>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <code className="bg-light p-2 rounded flex-grow-1" style={{ fontSize: '14px' }}>
                        {items.userActiveItems.items.urlEMB}
                      </code>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          copy(items.userActiveItems.items.urlEMB);
                        }}
                        title="Copy đường dẫn"
                      >
                        📋 Copy
                      </button>
                    </div>

                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => createFolderEMB(items.userActiveItems)}
                  >
                    📁 Tạo Thư mục
                  </button>
                )}
              </div>
            )}

            {/* Hiển thị thông báo khi không có item active */}
            {!items.userActiveItems && (
              <div className="alert alert-info">
                Bạn chưa có đơn hàng nào đang thiết kế. Hãy nhận một đơn hàng từ danh sách bên trái.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Wrap với AuthGuard
export default function Design() {
  return (
    <AuthGuard>
      <DesignContent />
    </AuthGuard>
  );
} 