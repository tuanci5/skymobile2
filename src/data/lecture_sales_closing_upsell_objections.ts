// Bài giảng: Kỹ năng chốt đơn, upsell, xử lý từ chối (Sale) - 60 phút

export const LECTURE_SALES_CLOSING_UPSELL_OBJECTIONS = {
  title: "Kỹ năng chốt đơn, upsell, xử lý từ chối (Sale)",
  duration: 60,
  instructor: "Phòng Sale & Ban Quản lý",
  objectives: [
    "Nắm được tư duy chốt đơn đúng: tư vấn để khách ra quyết định, không ép mua",
    "Biết cách xác định nhu cầu thật và chọn thời điểm chốt phù hợp",
    "Áp dụng được các kỹ thuật upsell/cross-sell SIM, WiFi, Hikari và dịch vụ gia hạn",
    "Xử lý được các từ chối phổ biến: đắt, để suy nghĩ, hỏi người thân, sợ lừa đảo, chưa cần",
    "Chuẩn hóa kịch bản chat/call để tăng tỷ lệ chốt và giảm bỏ sót khách"
  ],
  sections: [
    {
      title: "Phần 1: Tư duy Sale thực chiến",
      duration: 10,
      content: [
        {
          topic: "Sale không phải là nói nhiều, Sale là giúp khách quyết định đúng",
          points: [
            "Khách hàng thường không mua vì chưa đủ tin, chưa rõ lợi ích, hoặc sợ rủi ro",
            "Nhiệm vụ của Sale: hỏi đúng - tư vấn đúng - xác nhận đúng - chốt đúng thời điểm",
            "Không tranh cãi với khách; luôn kéo khách về nhu cầu thực tế của họ",
            "Chốt đơn tốt bắt đầu từ việc hiểu khách, không phải từ câu 'Anh/chị lấy nhé?'",
            "Mỗi cuộc chat/call phải có bước tiếp theo rõ ràng: gửi gói, xác nhận giấy tờ, hẹn giờ, lên đơn"
          ],
          examples: [
            "Ví dụ: Khách hỏi 'SIM nào rẻ nhất?' chưa chắc chỉ cần rẻ. Có thể họ cần mạng ổn, không phát sinh phí, dùng ở vùng xa. Sale phải hỏi thêm trước khi báo gói."
          ],
          time: 4
        },
        {
          topic: "Công thức 4 bước cho một cuộc tư vấn",
          points: [
            "BƯỚC 1: Mở đầu nhanh, thân thiện, tạo tin tưởng",
            "BƯỚC 2: Khai thác nhu cầu: khu vực ở Nhật, thiết bị đang dùng, dung lượng, thời gian cần, ngân sách",
            "BƯỚC 3: Đề xuất 1-2 phương án phù hợp, nói rõ lợi ích và điều kiện",
            "BƯỚC 4: Chốt bước tiếp theo: lấy thông tin, gửi form, hẹn gọi, hoặc lên đơn",
            "Không đưa quá nhiều lựa chọn khiến khách rối; ưu tiên 1 phương án chính + 1 phương án nâng cấp"
          ],
          time: 3
        },
        {
          topic: "Checklist trước khi chốt",
          points: [
            "✓ Khách đã hiểu sản phẩm/gói cước",
            "✓ Khách đã rõ giá, phí đầu vào, phí duy trì, phí phát sinh nếu có",
            "✓ Khách đã rõ thời gian nhận/kích hoạt",
            "✓ Khách đã được xử lý thắc mắc chính",
            "✓ Sale đã xác nhận nhu cầu và gói đề xuất phù hợp"
          ],
          time: 3
        }
      ]
    },
    {
      title: "Phần 2: Kỹ năng chốt đơn",
      duration: 15,
      content: [
        {
          topic: "5 thời điểm nên chốt đơn",
          points: [
            "1. Khách hỏi giá, phí, thời gian nhận hàng hoặc thủ tục",
            "2. Khách so sánh giữa 2 gói và cần lời khuyên",
            "3. Khách nói 'cũng được', 'nghe ổn', 'gửi mình thông tin'",
            "4. Khách đã gửi giấy tờ/thông tin cá nhân",
            "5. Khách có vấn đề gấp: cần mạng ngay, sắp chuyển nhà, SIM cũ lỗi, WiFi yếu"
          ],
          examples: [
            "Kịch bản: 'Với nhu cầu dùng YouTube, gọi video và đi làm ở khu vực này, em chốt cho anh/chị gói này là hợp lý nhất. Em lên đơn để giữ lịch giao/kích hoạt cho mình nhé?'"
          ],
          time: 4
        },
        {
          topic: "Các mẫu câu chốt đơn mềm",
          points: [
            "CHỐT LỰA CHỌN: 'Mình ưu tiên gói tiết kiệm hay gói mạng khỏe hơn ạ?'",
            "CHỐT THỜI GIAN: 'Anh/chị cần nhận trong hôm nay hay ngày mai để em sắp lịch?'",
            "CHỐT HÀNH ĐỘNG: 'Em gửi form đăng ký, mình điền giúp em thông tin để em xử lý luôn nhé?'",
            "CHỐT GIẢ ĐỊNH: 'Em lên đơn theo địa chỉ này, nếu có gì cần chỉnh mình báo em ngay ạ.'",
            "CHỐT THEO LỢI ÍCH: 'Gói này giúp mình dùng ổn hơn và tránh phát sinh, em khuyên mình chọn phương án này.'"
          ],
          time: 4
        },
        {
          topic: "Những lỗi làm mất đơn",
          points: [
            "Báo giá quá sớm khi chưa hiểu nhu cầu",
            "Trả lời cụt, thiếu bước tiếp theo",
            "Để khách chờ lâu sau khi khách đã có tín hiệu mua",
            "Đưa quá nhiều gói, khách không biết chọn gì",
            "Không xác nhận lại phí/điều kiện khiến khách mất tin tưởng",
            "Không follow lại khách sau khi khách nói 'để suy nghĩ'"
          ],
          time: 3
        },
        {
          topic: "Bài tập thực hành chốt đơn",
          points: [
            "TÌNH HUỐNG: Khách hỏi SIM data dùng TikTok, YouTube mỗi ngày, muốn rẻ nhưng mạng ổn",
            "NHIỆM VỤ: Hỏi 3 câu khai thác nhu cầu, đề xuất 1 gói chính + 1 gói nâng cấp, viết câu chốt đơn",
            "TIÊU CHÍ: Câu trả lời ngắn, rõ, có lý do đề xuất và có bước tiếp theo"
          ],
          time: 4
        }
      ]
    },
    {
      title: "Phần 3: Upsell & Cross-sell không gây khó chịu",
      duration: 12,
      content: [
        {
          topic: "Khi nào nên upsell?",
          points: [
            "Khi khách có nhu cầu cao hơn gói thấp nhất: xem video nhiều, làm online, dùng nhiều thiết bị",
            "Khi khách sợ phát sinh hoặc cần ổn định lâu dài",
            "Khi khách mua SIM nhưng có nhu cầu WiFi/Hikari cho nhà hoặc ký túc xá",
            "Khi khách sắp hết hạn/gia hạn và đã hài lòng với dịch vụ",
            "Không upsell nếu sản phẩm nâng cấp không giải quyết đúng nhu cầu của khách"
          ],
          time: 3
        },
        {
          topic: "Công thức upsell 3 câu",
          points: [
            "Câu 1 - Xác nhận nhu cầu: 'Mình dùng nhiều video và gọi video mỗi ngày đúng không ạ?'",
            "Câu 2 - Nêu rủi ro nếu chọn gói thấp: 'Nếu chọn gói thấp quá, cuối tháng dễ chậm hoặc phát sinh khó chịu.'",
            "Câu 3 - Đề xuất nâng cấp có lý do: 'Em khuyên mình lên gói này, chênh không nhiều nhưng dùng ổn hơn.'",
            "Luôn để khách cảm thấy được tư vấn, không bị ép mua"
          ],
          examples: [
            "Ví dụ: 'Gói tiết kiệm dùng được, nhưng với nhu cầu xem video hằng ngày thì em khuyên mình lên gói cao hơn để tránh cuối tháng bị chậm. Mình chọn phương án ổn định hơn nhé?'"
          ],
          time: 4
        },
        {
          topic: "Cross-sell theo vòng đời khách hàng",
          points: [
            "Khách mới sang Nhật: SIM nghe gọi/data + hỗ trợ thủ tục cơ bản",
            "Khách chuyển nhà: Hikari/WiFi cố định + tư vấn mạng ổn định",
            "Khách dùng nhiều thiết bị: Pocket WiFi hoặc gói dung lượng cao",
            "Khách sắp hết hạn: gia hạn, đổi gói phù hợp hơn, giới thiệu thêm dịch vụ liên quan",
            "Khách hài lòng: xin giới thiệu bạn bè/người thân"
          ],
          time: 3
        },
        {
          topic: "Câu hỏi mở để tìm cơ hội upsell",
          points: [
            "'Mình dùng mạng chủ yếu cho điện thoại hay cả máy tính nữa ạ?'",
            "'Nhà mình có mấy người dùng chung mạng?'",
            "'Mình ưu tiên tiết kiệm nhất hay ổn định để làm việc/học online?'",
            "'Sắp tới mình có chuyển nhà/gia hạn/đổi điện thoại không ạ?'"
          ],
          time: 2
        }
      ]
    },
    {
      title: "Phần 4: Xử lý từ chối phổ biến",
      duration: 18,
      content: [
        {
          topic: "Nguyên tắc xử lý từ chối LACE",
          points: [
            "L - Listen: Nghe hết ý khách, không cắt lời",
            "A - Acknowledge: Công nhận lo lắng của khách là hợp lý",
            "C - Clarify: Hỏi rõ lý do thật phía sau lời từ chối",
            "E - Explain & Exit: Giải thích ngắn gọn và chốt bước tiếp theo",
            "Mục tiêu không phải thắng tranh luận, mục tiêu là gỡ rào cản mua hàng"
          ],
          time: 3
        },
        {
          topic: "Từ chối: 'Đắt quá'",
          points: [
            "THAY VÌ: 'Không đắt đâu chị'",
            "NÊN NÓI: 'Dạ em hiểu mình muốn tối ưu chi phí. Để em so lại nhu cầu dùng thực tế, nếu mình dùng ít em chọn gói tiết kiệm, còn dùng nhiều thì gói rẻ quá có thể phát sinh/chậm cuối tháng.'",
            "Hỏi thêm: 'Mình muốn giữ trong khoảng ngân sách bao nhiêu mỗi tháng ạ?'",
            "Chốt lại: 'Với ngân sách đó, em đề xuất phương án này là hợp lý nhất.'"
          ],
          time: 3
        },
        {
          topic: "Từ chối: 'Để anh/chị suy nghĩ thêm'",
          points: [
            "THAY VÌ: 'Vâng ạ' rồi bỏ qua",
            "NÊN NÓI: 'Dạ được ạ. Để em tư vấn sát hơn, mình đang lăn tăn phần giá, thủ tục hay chất lượng mạng ạ?'",
            "Nếu khách chưa rõ: tóm tắt 2 lợi ích chính + 1 bước tiếp theo",
            "Chốt follow: 'Em nhắn lại mình lúc 8h tối được không ạ, để mình có thời gian xem kỹ?'"
          ],
          time: 3
        },
        {
          topic: "Từ chối: 'Tôi hỏi người thân/bạn bè đã'",
          points: [
            "Công nhận: 'Dạ đúng rồi, dịch vụ dùng lâu dài nên mình hỏi thêm cho chắc là hợp lý.'",
            "Hỗ trợ: 'Em gửi mình tóm tắt gói, phí và điều kiện để mình gửi người thân xem cho dễ nhé.'",
            "Giữ quyền chủ động: 'Mình cần em giải thích thêm phần nào để dễ trao đổi với người thân không ạ?'",
            "Follow: 'Em xin phép nhắn lại mình sau khi mình trao đổi xong nhé.'"
          ],
          time: 3
        },
        {
          topic: "Từ chối: 'Sợ lừa đảo / không tin'",
          points: [
            "Không khó chịu, vì khách có quyền cẩn thận",
            "Cung cấp bằng chứng: fanpage, website, địa chỉ, review, quy trình, hợp đồng/biên nhận nếu có",
            "Nói rõ phí và cam kết, tránh mập mờ",
            "Mẫu câu: 'Dạ em hiểu, ở Nhật mình càng cần cẩn thận. Em gửi mình thông tin công ty/quy trình đăng ký và các khoản phí rõ ràng để mình kiểm tra trước.'",
            "Không thúc ép thanh toán khi khách chưa đủ tin"
          ],
          time: 3
        },
        {
          topic: "Từ chối: 'Chưa cần / để sau'",
          points: [
            "Hỏi thời điểm: 'Dạ khoảng khi nào mình cần dùng ạ?'",
            "Tạo lý do theo mốc thời gian: giao hàng, kích hoạt, chuyển nhà, hết hạn SIM cũ",
            "Chốt hẹn: 'Vậy em lưu lịch nhắc mình trước ngày đó 2-3 ngày để không bị gián đoạn mạng nhé?'",
            "Nếu khách chưa có nhu cầu thật: lưu tag, không spam, follow đúng thời điểm"
          ],
          time: 3
        },
        {
          topic: "Bài tập xử lý từ chối",
          points: [
            "TÌNH HUỐNG 1: Khách nói 'đắt quá' sau khi nghe gói bạn đề xuất",
            "TÌNH HUỐNG 2: Khách nói 'để hỏi chồng/vợ đã'",
            "TÌNH HUỐNG 3: Khách sợ chuyển khoản trước",
            "NHIỆM VỤ: Viết câu trả lời theo LACE, không quá 5 câu, có câu hỏi/chốt bước tiếp theo"
          ],
          time: 3
        }
      ]
    },
    {
      title: "Phần 5: Kịch bản mẫu & KPI áp dụng",
      duration: 5,
      content: [
        {
          topic: "Kịch bản chat chuẩn cho Sale",
          points: [
            "1. Chào khách + xác nhận nhu cầu chính",
            "2. Hỏi 2-4 câu ngắn để phân loại nhu cầu",
            "3. Đề xuất gói phù hợp nhất, kèm lý do",
            "4. Xử lý thắc mắc/từ chối nếu có",
            "5. Chốt bước tiếp theo: lên đơn/gửi form/hẹn gọi/follow lại",
            "6. Ghi chú CRM đầy đủ: nhu cầu, gói quan tâm, rào cản, thời điểm follow"
          ],
          time: 2
        },
        {
          topic: "KPI cần theo dõi sau đào tạo",
          points: [
            "Tỷ lệ phản hồi trong SLA",
            "Tỷ lệ khách mới thành đơn",
            "Tỷ lệ khách được follow sau khi 'để suy nghĩ'",
            "Giá trị đơn trung bình sau upsell/cross-sell",
            "Số khách bỏ sót/chưa có bước tiếp theo",
            "Tỷ lệ hoàn/hủy do tư vấn sai hoặc thiếu thông tin"
          ],
          time: 2
        },
        {
          topic: "Cam kết thực hành",
          points: [
            "Mỗi nhân viên Sale chọn 3 mẫu câu chốt đơn để dùng trong tuần",
            "Mỗi ngày ghi lại ít nhất 3 tình huống từ chối và cách xử lý",
            "Leader review ngẫu nhiên 5 cuộc chat/call mỗi tuần để coaching",
            "Mục tiêu: tăng tỷ lệ chốt nhưng vẫn giữ tư vấn đúng và trải nghiệm khách hàng tốt"
          ],
          time: 1
        }
      ]
    }
  ]
};
